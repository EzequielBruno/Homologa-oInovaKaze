-- Atualizar squads existentes para usar o formato normalizado
UPDATE squads 
SET empresa = CASE 
  WHEN lower(empresa) = 'eletro' THEN 'Eletro'
  WHEN lower(empresa) = 'zc' THEN 'ZC'
  WHEN lower(empresa) = 'zf' THEN 'ZF'
  WHEN lower(empresa) = 'zs' THEN 'ZS'
  ELSE empresa
END
WHERE lower(empresa) IN ('eletro', 'zc', 'zf', 'zs');