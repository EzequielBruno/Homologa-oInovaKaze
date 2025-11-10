-- Add foreign key relationships between demands and profiles
ALTER TABLE public.demands 
  ADD CONSTRAINT fk_demands_solicitante 
  FOREIGN KEY (solicitante_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE public.demands 
  ADD CONSTRAINT fk_demands_responsavel_tecnico 
  FOREIGN KEY (responsavel_tecnico_id) 
  REFERENCES public.profiles(id) 
  ON DELETE SET NULL;

-- Add foreign key relationship between phases and demands
ALTER TABLE public.phases
  ADD CONSTRAINT fk_phases_demanda
  FOREIGN KEY (demanda_id)
  REFERENCES public.demands(id)
  ON DELETE CASCADE;

-- Add foreign key relationship between demand_evaluations and demands
ALTER TABLE public.demand_evaluations
  ADD CONSTRAINT fk_evaluations_demand
  FOREIGN KEY (demand_id)
  REFERENCES public.demands(id)
  ON DELETE CASCADE;

ALTER TABLE public.demand_evaluations
  ADD CONSTRAINT fk_evaluations_evaluator
  FOREIGN KEY (evaluator_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- Add foreign key relationship between reviews and profiles
ALTER TABLE public.reviews
  ADD CONSTRAINT fk_reviews_created_by
  FOREIGN KEY (created_by)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;