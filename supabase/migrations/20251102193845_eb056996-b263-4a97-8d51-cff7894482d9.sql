-- Corrige a função generate_new_demand_code para fazer cast correto do parâmetro empresa
CREATE OR REPLACE FUNCTION public.generate_new_demand_code(
  p_empresa text, 
  p_created_at timestamp with time zone DEFAULT now()
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_empresa_prefix TEXT;
  v_year INTEGER;
  v_month TEXT;
  v_sequence INTEGER;
  v_year_start TIMESTAMPTZ;
  v_year_end TIMESTAMPTZ;
BEGIN
  -- Define o prefixo da empresa
  v_empresa_prefix := CASE p_empresa
    WHEN 'ZC' THEN 'ZC'
    WHEN 'Eletro' THEN 'ELETRO'
    WHEN 'ZF' THEN 'ZF'
    WHEN 'ZS' THEN 'ZS'
    ELSE p_empresa
  END;
  
  -- Extrai ano e mês
  v_year := EXTRACT(YEAR FROM p_created_at);
  v_month := LPAD(EXTRACT(MONTH FROM p_created_at)::TEXT, 2, '0');
  
  -- Define o intervalo do ano
  v_year_start := DATE_TRUNC('year', p_created_at);
  v_year_end := v_year_start + INTERVAL '1 year' - INTERVAL '1 second';
  
  -- Busca o próximo número sequencial para este ano e empresa
  -- CAST EXPLÍCITO para empresa_type para evitar erro de operador
  SELECT COALESCE(MAX(
    SUBSTRING(codigo FROM '\d{5}')::INTEGER
  ), 0) + 1
  INTO v_sequence
  FROM demands
  WHERE empresa = p_empresa::empresa_type
    AND created_at >= v_year_start
    AND created_at <= v_year_end;
  
  -- Retorna o código no formato: EMPRESA-SEQUENCIAL-MESANO
  RETURN v_empresa_prefix || '-' || 
         LPAD(v_sequence::TEXT, 5, '0') || '-' || 
         v_month || v_year::TEXT;
END;
$function$;