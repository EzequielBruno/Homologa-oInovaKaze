-- Função para gerar o novo código de demanda
CREATE OR REPLACE FUNCTION generate_new_demand_code(
  p_empresa TEXT,
  p_created_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
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
  SELECT COALESCE(MAX(
    SUBSTRING(codigo FROM '\d{5}')::INTEGER
  ), 0) + 1
  INTO v_sequence
  FROM demands
  WHERE empresa = p_empresa
    AND created_at >= v_year_start
    AND created_at <= v_year_end;
  
  -- Retorna o código no formato: EMPRESA-SEQUENCIAL-MESANO
  RETURN v_empresa_prefix || '-' || 
         LPAD(v_sequence::TEXT, 5, '0') || '-' || 
         v_month || v_year::TEXT;
END;
$$;

-- Atualiza todos os códigos existentes para o novo formato
DO $$
DECLARE
  v_demand RECORD;
  v_new_code TEXT;
  v_sequence INTEGER;
  v_year INTEGER;
  v_month TEXT;
  v_empresa_prefix TEXT;
BEGIN
  -- Para cada empresa, processa as demandas ordenadas por data de criação
  FOR v_demand IN 
    SELECT id, empresa, created_at,
           EXTRACT(YEAR FROM created_at) as year,
           ROW_NUMBER() OVER (
             PARTITION BY empresa, EXTRACT(YEAR FROM created_at) 
             ORDER BY created_at
           ) as seq
    FROM demands
    ORDER BY empresa, created_at
  LOOP
    -- Define o prefixo da empresa
    v_empresa_prefix := CASE v_demand.empresa::TEXT
      WHEN 'ZC' THEN 'ZC'
      WHEN 'Eletro' THEN 'ELETRO'
      WHEN 'ZF' THEN 'ZF'
      WHEN 'ZS' THEN 'ZS'
      ELSE v_demand.empresa::TEXT
    END;
    
    -- Extrai mês e ano
    v_month := LPAD(EXTRACT(MONTH FROM v_demand.created_at)::TEXT, 2, '0');
    
    -- Gera o novo código
    v_new_code := v_empresa_prefix || '-' || 
                  LPAD(v_demand.seq::TEXT, 5, '0') || '-' || 
                  v_month || v_demand.year::TEXT;
    
    -- Atualiza o código da demanda
    UPDATE demands
    SET codigo = v_new_code
    WHERE id = v_demand.id;
  END LOOP;
END;
$$;