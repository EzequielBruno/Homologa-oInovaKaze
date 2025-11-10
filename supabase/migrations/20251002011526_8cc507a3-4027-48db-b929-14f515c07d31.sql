-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'tech_lead', 'developer', 'user');
CREATE TYPE public.demand_status AS ENUM (
  'Backlog',
  'Refinamento_TI',
  'Aguardando_Planning',
  'Em_Analise_Comite',
  'Aprovado',
  'Em_Progresso',
  'Revisao',
  'Concluido',
  'StandBy',
  'Nao_Entregue'
);
CREATE TYPE public.demand_priority AS ENUM ('Baixa', 'Média', 'Alta', 'Crítica');
CREATE TYPE public.empresa_type AS ENUM ('ZC', 'Eletro', 'ZF', 'ZS');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  cargo TEXT,
  departamento TEXT,
  empresa empresa_type,
  telefone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- User roles policies (only admins can manage roles)
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create demands table
CREATE TABLE public.demands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo TEXT UNIQUE NOT NULL,
  empresa empresa_type NOT NULL,
  departamento TEXT NOT NULL,
  descricao TEXT NOT NULL,
  estudo_viabilidade_url TEXT,
  prioridade demand_priority NOT NULL DEFAULT 'Média',
  regulatorio BOOLEAN DEFAULT FALSE,
  data_limite_regulatorio DATE,
  status demand_status NOT NULL DEFAULT 'Backlog',
  solicitante_id UUID REFERENCES auth.users(id) NOT NULL,
  responsavel_tecnico_id UUID REFERENCES auth.users(id),
  horas_estimadas NUMERIC(10,2),
  custo_estimado NUMERIC(12,2),
  data_inicio DATE,
  data_conclusao DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on demands
ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;

-- Demands policies
CREATE POLICY "Users can view all demands"
  ON public.demands FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create demands"
  ON public.demands FOR INSERT
  WITH CHECK (auth.uid() = solicitante_id);

CREATE POLICY "Users can update own demands or tech leads can update all"
  ON public.demands FOR UPDATE
  USING (
    auth.uid() = solicitante_id OR 
    public.has_role(auth.uid(), 'tech_lead') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Create phases table
CREATE TABLE public.phases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  demanda_id UUID REFERENCES public.demands(id) ON DELETE CASCADE NOT NULL,
  fase_numero INTEGER NOT NULL,
  nome_fase TEXT NOT NULL,
  descricao_fase TEXT,
  horas_estimadas NUMERIC(10,2) NOT NULL DEFAULT 0,
  ordem_execucao INTEGER NOT NULL,
  dependencias TEXT,
  status demand_status DEFAULT 'Backlog',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(demanda_id, fase_numero)
);

-- Enable RLS on phases
ALTER TABLE public.phases ENABLE ROW LEVEL SECURITY;

-- Phases policies
CREATE POLICY "Users can view all phases"
  ON public.phases FOR SELECT
  USING (true);

CREATE POLICY "Tech leads and admins can manage phases"
  ON public.phases FOR ALL
  USING (
    public.has_role(auth.uid(), 'tech_lead') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Create reviews table (retrospectivas)
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_number INTEGER UNIQUE NOT NULL,
  data_review DATE NOT NULL,
  empresa TEXT NOT NULL,
  demandas_entregues TEXT[],
  pontos_positivos TEXT,
  pontos_melhoria TEXT,
  solicitacoes_apoio TEXT,
  participantes TEXT[],
  velocidade_sprint NUMERIC(5,2),
  qualidade_entrega NUMERIC(5,2),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Reviews policies
CREATE POLICY "Users can view all reviews"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Tech leads and admins can manage reviews"
  ON public.reviews FOR ALL
  USING (
    public.has_role(auth.uid(), 'tech_lead') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_demands_updated_at
  BEFORE UPDATE ON public.demands
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_phases_updated_at
  BEFORE UPDATE ON public.phases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_demands_solicitante ON public.demands(solicitante_id);
CREATE INDEX idx_demands_status ON public.demands(status);
CREATE INDEX idx_demands_empresa ON public.demands(empresa);
CREATE INDEX idx_phases_demanda ON public.phases(demanda_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);