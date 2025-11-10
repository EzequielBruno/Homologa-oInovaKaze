-- Criar enum demand_action com todos os valores necessários
DO $$ 
BEGIN
    -- Verifica se o enum já existe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'demand_action') THEN
        CREATE TYPE demand_action AS ENUM (
            'adicionar_fase',
            'aprovar',
            'aprovar_comite',
            'aprovar_gerente',
            'aprovar_ti',
            'arquivar',
            'atualizar_fase',
            'cancelar',
            'criar',
            'editar',
            'enviar_notificacao',
            'iniciar_aprovacao',
            'mudanca_escopo',
            'mudanca_status',
            'recusar',
            'remover_fase',
            'reprovar',
            'reverter_faseamento',
            'solicitar_insumo',
            'solicitar_mudanca'
        );
    ELSE
        -- Se o enum existe, adiciona o novo valor
        ALTER TYPE demand_action ADD VALUE IF NOT EXISTS 'mudanca_escopo';
    END IF;
END $$;