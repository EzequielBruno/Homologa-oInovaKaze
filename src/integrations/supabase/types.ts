export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      access_groups: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          is_system_group: boolean | null
          nome: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_system_group?: boolean | null
          nome: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_system_group?: boolean | null
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      auto_transition_config: {
        Row: {
          auto_transition: boolean
          created_at: string
          criticidade: string
          empresa: string
          id: string
          updated_at: string
        }
        Insert: {
          auto_transition?: boolean
          created_at?: string
          criticidade: string
          empresa: string
          id?: string
          updated_at?: string
        }
        Update: {
          auto_transition?: boolean
          created_at?: string
          criticidade?: string
          empresa?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      committee_members: {
        Row: {
          ativo: boolean
          cargo: string | null
          created_at: string
          id: string
          nome: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          cargo?: string | null
          created_at?: string
          id?: string
          nome: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          cargo?: string | null
          created_at?: string
          id?: string
          nome?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_squad_forms: {
        Row: {
          ativo: boolean
          created_at: string
          created_by: string
          empresa: string
          id: string
          squad: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          created_by: string
          empresa: string
          id?: string
          squad: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          created_by?: string
          empresa?: string
          id?: string
          squad?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_standups: {
        Row: {
          created_at: string
          data: string
          hoje: string
          id: string
          impedimentos: string | null
          ontem: string
          squad: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: string
          hoje: string
          id?: string
          impedimentos?: string | null
          ontem: string
          squad: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          hoje?: string
          id?: string
          impedimentos?: string | null
          ontem?: string
          squad?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_updates: {
        Row: {
          created_at: string
          created_by: string
          demand_id: string
          id: string
          update_text: string
        }
        Insert: {
          created_at?: string
          created_by: string
          demand_id: string
          id?: string
          update_text: string
        }
        Update: {
          created_at?: string
          created_by?: string
          demand_id?: string
          id?: string
          update_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_updates_demand_id_fkey"
            columns: ["demand_id"]
            isOneToOne: false
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_approvals: {
        Row: {
          approval_level: Database["public"]["Enums"]["approval_level"]
          approver_id: string
          created_at: string
          demand_id: string
          id: string
          motivo_recusa: string | null
          status: Database["public"]["Enums"]["approval_status"]
          updated_at: string
        }
        Insert: {
          approval_level: Database["public"]["Enums"]["approval_level"]
          approver_id: string
          created_at?: string
          demand_id: string
          id?: string
          motivo_recusa?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
        }
        Update: {
          approval_level?: Database["public"]["Enums"]["approval_level"]
          approver_id?: string
          created_at?: string
          demand_id?: string
          id?: string
          motivo_recusa?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_approvals_demand_id_fkey"
            columns: ["demand_id"]
            isOneToOne: false
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_assignments: {
        Row: {
          assigned_by: string
          assigned_to: string
          created_at: string
          demand_id: string
          faseamento_completo: boolean
          id: string
          notificacao_pendente: boolean
          prazo_faseamento: string | null
          sprint_number: number
          updated_at: string
        }
        Insert: {
          assigned_by: string
          assigned_to: string
          created_at?: string
          demand_id: string
          faseamento_completo?: boolean
          id?: string
          notificacao_pendente?: boolean
          prazo_faseamento?: string | null
          sprint_number: number
          updated_at?: string
        }
        Update: {
          assigned_by?: string
          assigned_to?: string
          created_at?: string
          demand_id?: string
          faseamento_completo?: boolean
          id?: string
          notificacao_pendente?: boolean
          prazo_faseamento?: string | null
          sprint_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_assignments_demand_id_fkey"
            columns: ["demand_id"]
            isOneToOne: false
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_comments: {
        Row: {
          comentario: string
          created_at: string
          demand_id: string
          id: string
          manager_id: string
          updated_at: string
        }
        Insert: {
          comentario: string
          created_at?: string
          demand_id: string
          id?: string
          manager_id: string
          updated_at?: string
        }
        Update: {
          comentario?: string
          created_at?: string
          demand_id?: string
          id?: string
          manager_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_comments_demand_id_fkey"
            columns: ["demand_id"]
            isOneToOne: false
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_comments_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_dependencies: {
        Row: {
          created_at: string
          demand_id: string
          depends_on_demand_id: string
          descricao: string | null
          id: string
          tipo_dependencia: string
        }
        Insert: {
          created_at?: string
          demand_id: string
          depends_on_demand_id: string
          descricao?: string | null
          id?: string
          tipo_dependencia: string
        }
        Update: {
          created_at?: string
          demand_id?: string
          depends_on_demand_id?: string
          descricao?: string | null
          id?: string
          tipo_dependencia?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_dependencies_demand_id_fkey"
            columns: ["demand_id"]
            isOneToOne: false
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_dependencies_depends_on_demand_id_fkey"
            columns: ["depends_on_demand_id"]
            isOneToOne: false
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_evaluations: {
        Row: {
          aprovado: boolean | null
          comentario: string | null
          created_at: string | null
          demand_id: string
          evaluator_id: string
          id: string
          pontuacao: number | null
          tipo_avaliacao: string
          updated_at: string | null
        }
        Insert: {
          aprovado?: boolean | null
          comentario?: string | null
          created_at?: string | null
          demand_id: string
          evaluator_id: string
          id?: string
          pontuacao?: number | null
          tipo_avaliacao: string
          updated_at?: string | null
        }
        Update: {
          aprovado?: boolean | null
          comentario?: string | null
          created_at?: string | null
          demand_id?: string
          evaluator_id?: string
          id?: string
          pontuacao?: number | null
          tipo_avaliacao?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demand_evaluations_demand_id_fkey"
            columns: ["demand_id"]
            isOneToOne: false
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_evaluations_demand"
            columns: ["demand_id"]
            isOneToOne: false
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_evaluations_evaluator"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_history: {
        Row: {
          action: Database["public"]["Enums"]["action_type"]
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          demand_id: string
          descricao: string
          id: string
          snapshot_completo: Json | null
          user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["action_type"]
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          demand_id: string
          descricao: string
          id?: string
          snapshot_completo?: Json | null
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["action_type"]
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          demand_id?: string
          descricao?: string
          id?: string
          snapshot_completo?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_history_demand_id_fkey"
            columns: ["demand_id"]
            isOneToOne: false
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
        ]
      }
      demands: {
        Row: {
          aguardando_insumo: boolean | null
          avaliacao_risco_realizada: boolean | null
          checklist_entrega: string | null
          classificacao: string | null
          codigo: string
          codigo_base: string | null
          created_at: string | null
          custo_estimado: number | null
          data_aprovacao_comite: string | null
          data_conclusao: string | null
          data_inicio: string | null
          data_limite_regulatorio: string | null
          departamento: string
          descricao: string
          documentos_anexados: string[] | null
          empresa: Database["public"]["Enums"]["empresa_type"]
          estudo_viabilidade_url: string | null
          horas_estimadas: number | null
          id: string
          justificativa_comite: string | null
          melhoria_alternativas: string | null
          melhoria_beneficio_esperado: string | null
          melhoria_problema_atual: string | null
          observacoes: string | null
          orcamento_fornecedor_id: string | null
          pontuacao_selecao: number | null
          prioridade: Database["public"]["Enums"]["demand_priority"]
          regulatorio: boolean | null
          requisitos_funcionais: string | null
          responsavel_tecnico_id: string | null
          resultados_alcancados: string | null
          roi_estimado: number | null
          roi_realizado: number | null
          setor: Database["public"]["Enums"]["setor_type"] | null
          solicitante_id: string
          sprint_atual: number | null
          squad: string | null
          status: Database["public"]["Enums"]["demand_status"]
          tipo_projeto: Database["public"]["Enums"]["project_type"] | null
          updated_at: string | null
          versao: number | null
        }
        Insert: {
          aguardando_insumo?: boolean | null
          avaliacao_risco_realizada?: boolean | null
          checklist_entrega?: string | null
          classificacao?: string | null
          codigo: string
          codigo_base?: string | null
          created_at?: string | null
          custo_estimado?: number | null
          data_aprovacao_comite?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          data_limite_regulatorio?: string | null
          departamento: string
          descricao: string
          documentos_anexados?: string[] | null
          empresa: Database["public"]["Enums"]["empresa_type"]
          estudo_viabilidade_url?: string | null
          horas_estimadas?: number | null
          id?: string
          justificativa_comite?: string | null
          melhoria_alternativas?: string | null
          melhoria_beneficio_esperado?: string | null
          melhoria_problema_atual?: string | null
          observacoes?: string | null
          orcamento_fornecedor_id?: string | null
          pontuacao_selecao?: number | null
          prioridade?: Database["public"]["Enums"]["demand_priority"]
          regulatorio?: boolean | null
          requisitos_funcionais?: string | null
          responsavel_tecnico_id?: string | null
          resultados_alcancados?: string | null
          roi_estimado?: number | null
          roi_realizado?: number | null
          setor?: Database["public"]["Enums"]["setor_type"] | null
          solicitante_id: string
          sprint_atual?: number | null
          squad?: string | null
          status?: Database["public"]["Enums"]["demand_status"]
          tipo_projeto?: Database["public"]["Enums"]["project_type"] | null
          updated_at?: string | null
          versao?: number | null
        }
        Update: {
          aguardando_insumo?: boolean | null
          avaliacao_risco_realizada?: boolean | null
          checklist_entrega?: string | null
          classificacao?: string | null
          codigo?: string
          codigo_base?: string | null
          created_at?: string | null
          custo_estimado?: number | null
          data_aprovacao_comite?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          data_limite_regulatorio?: string | null
          departamento?: string
          descricao?: string
          documentos_anexados?: string[] | null
          empresa?: Database["public"]["Enums"]["empresa_type"]
          estudo_viabilidade_url?: string | null
          horas_estimadas?: number | null
          id?: string
          justificativa_comite?: string | null
          melhoria_alternativas?: string | null
          melhoria_beneficio_esperado?: string | null
          melhoria_problema_atual?: string | null
          observacoes?: string | null
          orcamento_fornecedor_id?: string | null
          pontuacao_selecao?: number | null
          prioridade?: Database["public"]["Enums"]["demand_priority"]
          regulatorio?: boolean | null
          requisitos_funcionais?: string | null
          responsavel_tecnico_id?: string | null
          resultados_alcancados?: string | null
          roi_estimado?: number | null
          roi_realizado?: number | null
          setor?: Database["public"]["Enums"]["setor_type"] | null
          solicitante_id?: string
          sprint_atual?: number | null
          squad?: string | null
          status?: Database["public"]["Enums"]["demand_status"]
          tipo_projeto?: Database["public"]["Enums"]["project_type"] | null
          updated_at?: string | null
          versao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "demands_orcamento_fornecedor_id_fkey"
            columns: ["orcamento_fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_demands_responsavel_tecnico"
            columns: ["responsavel_tecnico_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_demands_solicitante"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_permissions: {
        Row: {
          created_at: string | null
          empresa: string
          group_id: string
          id: string
          nivel_acesso: string
        }
        Insert: {
          created_at?: string | null
          empresa: string
          group_id: string
          id?: string
          nivel_acesso: string
        }
        Update: {
          created_at?: string | null
          empresa?: string
          group_id?: string
          id?: string
          nivel_acesso?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresa_permissions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "access_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          id: string
          nome_completo: string
          nome_exibicao: string
          ordem: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          id?: string
          nome_completo: string
          nome_exibicao: string
          ordem?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          id?: string
          nome_completo?: string
          nome_exibicao?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: []
      }
      form_questions: {
        Row: {
          acao_ramificacao: string | null
          condicao_pergunta_id: string | null
          condicao_resposta: string | null
          created_at: string
          form_id: string
          id: string
          obrigatoria: boolean
          opcoes: string[] | null
          ordem: number
          permite_outro: boolean | null
          pular_para_pergunta_id: string | null
          texto: string
          tipo: string
        }
        Insert: {
          acao_ramificacao?: string | null
          condicao_pergunta_id?: string | null
          condicao_resposta?: string | null
          created_at?: string
          form_id: string
          id?: string
          obrigatoria?: boolean
          opcoes?: string[] | null
          ordem: number
          permite_outro?: boolean | null
          pular_para_pergunta_id?: string | null
          texto: string
          tipo: string
        }
        Update: {
          acao_ramificacao?: string | null
          condicao_pergunta_id?: string | null
          condicao_resposta?: string | null
          created_at?: string
          form_id?: string
          id?: string
          obrigatoria?: boolean
          opcoes?: string[] | null
          ordem?: number
          permite_outro?: boolean | null
          pular_para_pergunta_id?: string | null
          texto?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_questions_condicao_pergunta_id_fkey"
            columns: ["condicao_pergunta_id"]
            isOneToOne: false
            referencedRelation: "form_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_questions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "custom_squad_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      form_responses: {
        Row: {
          created_at: string
          demand_id: string
          id: string
          question_id: string
          resposta: string
        }
        Insert: {
          created_at?: string
          demand_id: string
          id?: string
          question_id: string
          resposta: string
        }
        Update: {
          created_at?: string
          demand_id?: string
          id?: string
          question_id?: string
          resposta?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_responses_demand_id_fkey"
            columns: ["demand_id"]
            isOneToOne: false
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "form_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          agencia: string
          bairro: string
          banco: string
          categoria: string
          celular: string | null
          cep: string
          cidade: string
          cnpj: string
          complemento: string | null
          conta: string
          contato_email: string
          contato_nome: string
          contato_telefone: string
          created_at: string
          email: string
          endereco: string
          estado: string
          id: string
          inscricao_estadual: string | null
          limite_credito: number | null
          nome_fantasia: string
          numero: string
          observacoes: string | null
          pais: string
          pix: string | null
          portal_suporte: string | null
          prazo_pagamento: string
          razao_social: string
          servicos_oferecidos: string
          site: string | null
          status: Database["public"]["Enums"]["fornecedor_status"]
          telefone: string
          updated_at: string
        }
        Insert: {
          agencia: string
          bairro: string
          banco: string
          categoria: string
          celular?: string | null
          cep: string
          cidade: string
          cnpj: string
          complemento?: string | null
          conta: string
          contato_email: string
          contato_nome: string
          contato_telefone: string
          created_at?: string
          email: string
          endereco: string
          estado: string
          id?: string
          inscricao_estadual?: string | null
          limite_credito?: number | null
          nome_fantasia: string
          numero: string
          observacoes?: string | null
          pais: string
          pix?: string | null
          portal_suporte?: string | null
          prazo_pagamento: string
          razao_social: string
          servicos_oferecidos: string
          site?: string | null
          status?: Database["public"]["Enums"]["fornecedor_status"]
          telefone: string
          updated_at?: string
        }
        Update: {
          agencia?: string
          bairro?: string
          banco?: string
          categoria?: string
          celular?: string | null
          cep?: string
          cidade?: string
          cnpj?: string
          complemento?: string | null
          conta?: string
          contato_email?: string
          contato_nome?: string
          contato_telefone?: string
          created_at?: string
          email?: string
          endereco?: string
          estado?: string
          id?: string
          inscricao_estadual?: string | null
          limite_credito?: number | null
          nome_fantasia?: string
          numero?: string
          observacoes?: string | null
          pais?: string
          pix?: string | null
          portal_suporte?: string | null
          prazo_pagamento?: string
          razao_social?: string
          servicos_oferecidos?: string
          site?: string | null
          status?: Database["public"]["Enums"]["fornecedor_status"]
          telefone?: string
          updated_at?: string
        }
        Relationships: []
      }
      functional_requirement_signatures: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          requirement_id: string
          signature_hash: string | null
          signed_at: string | null
          signer_id: string
          status: Database["public"]["Enums"]["functional_requirement_signature_status"]
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          requirement_id: string
          signature_hash?: string | null
          signed_at?: string | null
          signer_id: string
          status?: Database["public"]["Enums"]["functional_requirement_signature_status"]
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          requirement_id?: string
          signature_hash?: string | null
          signed_at?: string | null
          signer_id?: string
          status?: Database["public"]["Enums"]["functional_requirement_signature_status"]
        }
        Relationships: [
          {
            foreignKeyName: "functional_requirement_signatures_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "functional_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      functional_requirements: {
        Row: {
          approver_ids: string[]
          created_at: string
          created_by: string
          current_approver_id: string | null
          descricao: string
          id: string
          setor: string
          status: Database["public"]["Enums"]["functional_requirement_status"]
          titulo: string
          updated_at: string
        }
        Insert: {
          approver_ids?: string[]
          created_at?: string
          created_by: string
          current_approver_id?: string | null
          descricao: string
          id?: string
          setor: string
          status?: Database["public"]["Enums"]["functional_requirement_status"]
          titulo: string
          updated_at?: string
        }
        Update: {
          approver_ids?: string[]
          created_at?: string
          created_by?: string
          current_approver_id?: string | null
          descricao?: string
          id?: string
          setor?: string
          status?: Database["public"]["Enums"]["functional_requirement_status"]
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      group_permissions: {
        Row: {
          action: Database["public"]["Enums"]["permission_action"]
          created_at: string | null
          group_id: string
          id: string
          resource: Database["public"]["Enums"]["permission_resource"]
        }
        Insert: {
          action: Database["public"]["Enums"]["permission_action"]
          created_at?: string | null
          group_id: string
          id?: string
          resource: Database["public"]["Enums"]["permission_resource"]
        }
        Update: {
          action?: Database["public"]["Enums"]["permission_action"]
          created_at?: string | null
          group_id?: string
          id?: string
          resource?: Database["public"]["Enums"]["permission_resource"]
        }
        Relationships: [
          {
            foreignKeyName: "group_permissions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "access_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          enabled: boolean
          event_type: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          event_type: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          event_type?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          lida: boolean
          message: string
          relacionado_id: string | null
          tipo: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lida?: boolean
          message: string
          relacionado_id?: string | null
          tipo: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lida?: boolean
          message?: string
          relacionado_id?: string | null
          tipo?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_condition_phases: {
        Row: {
          check_conclusao: boolean | null
          created_at: string | null
          created_by: string | null
          data_fim: string | null
          data_inicio: string | null
          data_validacao: string | null
          etapa_atividade: string
          horas_estimadas: number | null
          id: string
          observacoes: string | null
          ordem: number
          payment_condition_id: string
          percentual_conclusao: number | null
          responsavel_recurso: string
          status: string
          tipo_cobranca: string | null
          updated_at: string | null
          updated_by: string | null
          valor_etapa: number
          valor_por_hora: number | null
        }
        Insert: {
          check_conclusao?: boolean | null
          created_at?: string | null
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          data_validacao?: string | null
          etapa_atividade: string
          horas_estimadas?: number | null
          id?: string
          observacoes?: string | null
          ordem?: number
          payment_condition_id: string
          percentual_conclusao?: number | null
          responsavel_recurso: string
          status?: string
          tipo_cobranca?: string | null
          updated_at?: string | null
          updated_by?: string | null
          valor_etapa: number
          valor_por_hora?: number | null
        }
        Update: {
          check_conclusao?: boolean | null
          created_at?: string | null
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          data_validacao?: string | null
          etapa_atividade?: string
          horas_estimadas?: number | null
          id?: string
          observacoes?: string | null
          ordem?: number
          payment_condition_id?: string
          percentual_conclusao?: number | null
          responsavel_recurso?: string
          status?: string
          tipo_cobranca?: string | null
          updated_at?: string | null
          updated_by?: string | null
          valor_etapa?: number
          valor_por_hora?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_condition_phases_payment_condition_id_fkey"
            columns: ["payment_condition_id"]
            isOneToOne: false
            referencedRelation: "payment_conditions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_conditions: {
        Row: {
          cargo_perfil: string | null
          condicao_pagamento_etapa: string | null
          created_at: string
          created_by: string | null
          data_conclusao: string | null
          data_pagamento_prevista: string | null
          data_prevista_entrega: string | null
          demand_id: string | null
          descricao_etapa: string | null
          descricao_modalidade: string | null
          dia_faturamento: number | null
          documentos_anexados: string[] | null
          empresa: string
          faseamento_ativo: boolean | null
          forma_pagamento: string | null
          fornecedor_id: string
          grupo_condicao: string | null
          horas_inclusas: number | null
          id: string
          limite_mensal_horas: number | null
          link_chamado: string | null
          modalidade: string | null
          numero_chamado: string | null
          numero_orcamento: string | null
          observacoes: string | null
          periodicidade_faturamento: string | null
          prazo_pagamento_dias: number | null
          quantidade_total_horas: number | null
          responsavel_financeiro: string | null
          servicos_abrangidos: string | null
          status: string
          tipo_cadastro: string | null
          tipo_pagamento: string | null
          updated_at: string
          updated_by: string | null
          validade_meses: number | null
          valor_etapa: number | null
          valor_hora: number | null
          valor_hora_excedente: number | null
          valor_mensal_fixo: number | null
          valor_total_pacote: number | null
        }
        Insert: {
          cargo_perfil?: string | null
          condicao_pagamento_etapa?: string | null
          created_at?: string
          created_by?: string | null
          data_conclusao?: string | null
          data_pagamento_prevista?: string | null
          data_prevista_entrega?: string | null
          demand_id?: string | null
          descricao_etapa?: string | null
          descricao_modalidade?: string | null
          dia_faturamento?: number | null
          documentos_anexados?: string[] | null
          empresa?: string
          faseamento_ativo?: boolean | null
          forma_pagamento?: string | null
          fornecedor_id: string
          grupo_condicao?: string | null
          horas_inclusas?: number | null
          id?: string
          limite_mensal_horas?: number | null
          link_chamado?: string | null
          modalidade?: string | null
          numero_chamado?: string | null
          numero_orcamento?: string | null
          observacoes?: string | null
          periodicidade_faturamento?: string | null
          prazo_pagamento_dias?: number | null
          quantidade_total_horas?: number | null
          responsavel_financeiro?: string | null
          servicos_abrangidos?: string | null
          status?: string
          tipo_cadastro?: string | null
          tipo_pagamento?: string | null
          updated_at?: string
          updated_by?: string | null
          validade_meses?: number | null
          valor_etapa?: number | null
          valor_hora?: number | null
          valor_hora_excedente?: number | null
          valor_mensal_fixo?: number | null
          valor_total_pacote?: number | null
        }
        Update: {
          cargo_perfil?: string | null
          condicao_pagamento_etapa?: string | null
          created_at?: string
          created_by?: string | null
          data_conclusao?: string | null
          data_pagamento_prevista?: string | null
          data_prevista_entrega?: string | null
          demand_id?: string | null
          descricao_etapa?: string | null
          descricao_modalidade?: string | null
          dia_faturamento?: number | null
          documentos_anexados?: string[] | null
          empresa?: string
          faseamento_ativo?: boolean | null
          forma_pagamento?: string | null
          fornecedor_id?: string
          grupo_condicao?: string | null
          horas_inclusas?: number | null
          id?: string
          limite_mensal_horas?: number | null
          link_chamado?: string | null
          modalidade?: string | null
          numero_chamado?: string | null
          numero_orcamento?: string | null
          observacoes?: string | null
          periodicidade_faturamento?: string | null
          prazo_pagamento_dias?: number | null
          quantidade_total_horas?: number | null
          responsavel_financeiro?: string | null
          servicos_abrangidos?: string | null
          status?: string
          tipo_cadastro?: string | null
          tipo_pagamento?: string | null
          updated_at?: string
          updated_by?: string | null
          validade_meses?: number | null
          valor_etapa?: number | null
          valor_hora?: number | null
          valor_hora_excedente?: number | null
          valor_mensal_fixo?: number | null
          valor_total_pacote?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_conditions_demand_id_fkey"
            columns: ["demand_id"]
            isOneToOne: false
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_conditions_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_templates: {
        Row: {
          created_at: string
          created_by: string
          descricao: string | null
          fases: Json
          horas_estimadas_total: number | null
          id: string
          is_active: boolean | null
          nome: string
          tipo_projeto: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          descricao?: string | null
          fases: Json
          horas_estimadas_total?: number | null
          id?: string
          is_active?: boolean | null
          nome: string
          tipo_projeto: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          descricao?: string | null
          fases?: Json
          horas_estimadas_total?: number | null
          id?: string
          is_active?: boolean | null
          nome?: string
          tipo_projeto?: string
          updated_at?: string
        }
        Relationships: []
      }
      phases: {
        Row: {
          created_at: string | null
          demanda_id: string
          dependencias: string | null
          descricao_fase: string | null
          fase_numero: number
          horas_estimadas: number
          id: string
          nome_fase: string
          ordem_execucao: number
          status: Database["public"]["Enums"]["demand_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          demanda_id: string
          dependencias?: string | null
          descricao_fase?: string | null
          fase_numero: number
          horas_estimadas?: number
          id?: string
          nome_fase: string
          ordem_execucao: number
          status?: Database["public"]["Enums"]["demand_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          demanda_id?: string
          dependencias?: string | null
          descricao_fase?: string | null
          fase_numero?: number
          horas_estimadas?: number
          id?: string
          nome_fase?: string
          ordem_execucao?: number
          status?: Database["public"]["Enums"]["demand_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_phases_demanda"
            columns: ["demanda_id"]
            isOneToOne: false
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phases_demanda_id_fkey"
            columns: ["demanda_id"]
            isOneToOne: false
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_agendas: {
        Row: {
          convite_enviado: boolean
          created_at: string
          data_planning: string
          email_participantes: string[]
          empresa: string
          id: string
          squad: string
        }
        Insert: {
          convite_enviado?: boolean
          created_at?: string
          data_planning: string
          email_participantes: string[]
          empresa: string
          id?: string
          squad: string
        }
        Update: {
          convite_enviado?: boolean
          created_at?: string
          data_planning?: string
          email_participantes?: string[]
          empresa?: string
          id?: string
          squad?: string
        }
        Relationships: []
      }
      planning_poker_sessions: {
        Row: {
          created_at: string
          created_by: string
          demand_id: string
          final_estimate: number | null
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          demand_id: string
          final_estimate?: number | null
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          demand_id?: string
          final_estimate?: number | null
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_poker_sessions_demand_id_fkey"
            columns: ["demand_id"]
            isOneToOne: false
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_poker_votes: {
        Row: {
          created_at: string
          id: string
          session_id: string
          user_id: string
          vote: number
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          user_id: string
          vote: number
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          user_id?: string
          vote?: number
        }
        Relationships: [
          {
            foreignKeyName: "planning_poker_votes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "planning_poker_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          blocked_at: string | null
          cargo: string | null
          created_at: string | null
          departamento: string | null
          empresa: Database["public"]["Enums"]["empresa_type"] | null
          force_password_change: boolean | null
          full_name: string | null
          id: string
          is_active: boolean | null
          password_expires_at: string | null
          password_expiry_months: number | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          blocked_at?: string | null
          cargo?: string | null
          created_at?: string | null
          departamento?: string | null
          empresa?: Database["public"]["Enums"]["empresa_type"] | null
          force_password_change?: boolean | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          password_expires_at?: string | null
          password_expiry_months?: number | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          blocked_at?: string | null
          cargo?: string | null
          created_at?: string | null
          departamento?: string | null
          empresa?: Database["public"]["Enums"]["empresa_type"] | null
          force_password_change?: boolean | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          password_expires_at?: string | null
          password_expiry_months?: number | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_managers: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          empresa: string
          id: string
          nome: string
          squad: string | null
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          empresa: string
          id?: string
          nome: string
          squad?: string | null
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          empresa?: string
          id?: string
          nome?: string
          squad?: string | null
          user_id?: string
        }
        Relationships: []
      }
      review_agendas: {
        Row: {
          convite_enviado: boolean
          created_at: string
          data_review: string
          email_participantes: string[]
          empresa: string
          id: string
          squad: string
        }
        Insert: {
          convite_enviado?: boolean
          created_at?: string
          data_review: string
          email_participantes: string[]
          empresa: string
          id?: string
          squad: string
        }
        Update: {
          convite_enviado?: boolean
          created_at?: string
          data_review?: string
          email_participantes?: string[]
          empresa?: string
          id?: string
          squad?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string | null
          created_by: string
          data_review: string
          demandas_entregues: string[] | null
          empresa: string
          id: string
          participantes: string[] | null
          pontos_melhoria: string | null
          pontos_positivos: string | null
          qualidade_entrega: number | null
          review_number: number
          solicitacoes_apoio: string | null
          updated_at: string | null
          velocidade_sprint: number | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          data_review: string
          demandas_entregues?: string[] | null
          empresa: string
          id?: string
          participantes?: string[] | null
          pontos_melhoria?: string | null
          pontos_positivos?: string | null
          qualidade_entrega?: number | null
          review_number: number
          solicitacoes_apoio?: string | null
          updated_at?: string | null
          velocidade_sprint?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          data_review?: string
          demandas_entregues?: string[] | null
          empresa?: string
          id?: string
          participantes?: string[] | null
          pontos_melhoria?: string | null
          pontos_positivos?: string | null
          qualidade_entrega?: number | null
          review_number?: number
          solicitacoes_apoio?: string | null
          updated_at?: string | null
          velocidade_sprint?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_reviews_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_assessments: {
        Row: {
          acoes_mitigadoras: string | null
          classificacao_gerente: string | null
          created_at: string | null
          demand_id: string
          id: string
          impacto: string
          indice_risco: number
          manager_id: string
          probabilidade: string
          resposta_risco: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          acoes_mitigadoras?: string | null
          classificacao_gerente?: string | null
          created_at?: string | null
          demand_id: string
          id?: string
          impacto: string
          indice_risco: number
          manager_id: string
          probabilidade: string
          resposta_risco?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          acoes_mitigadoras?: string | null
          classificacao_gerente?: string | null
          created_at?: string | null
          demand_id?: string
          id?: string
          impacto?: string
          indice_risco?: number
          manager_id?: string
          probabilidade?: string
          resposta_risco?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_assessments_demand_id_fkey"
            columns: ["demand_id"]
            isOneToOne: false
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
        ]
      }
      scrum_masters: {
        Row: {
          ativo: boolean
          created_at: string
          empresa: string
          id: string
          nome: string
          squad: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          empresa: string
          id?: string
          nome: string
          squad: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          empresa?: string
          id?: string
          nome?: string
          squad?: string
          user_id?: string
        }
        Relationships: []
      }
      solicitantes: {
        Row: {
          ativo: boolean
          cargo: string
          created_at: string
          empresa: string
          id: string
          nome: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          cargo: string
          created_at?: string
          empresa: string
          id?: string
          nome: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          cargo?: string
          created_at?: string
          empresa?: string
          id?: string
          nome?: string
          user_id?: string
        }
        Relationships: []
      }
      sprint_reviews: {
        Row: {
          created_at: string
          demand_id: string
          feedback_melhoria: string | null
          feedback_positivo: string | null
          id: string
          observacoes: string | null
          pontuacao_qualidade: number | null
          reviewed_by: string
          sprint_number: number
          status_entrega: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          demand_id: string
          feedback_melhoria?: string | null
          feedback_positivo?: string | null
          id?: string
          observacoes?: string | null
          pontuacao_qualidade?: number | null
          reviewed_by: string
          sprint_number: number
          status_entrega: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          demand_id?: string
          feedback_melhoria?: string | null
          feedback_positivo?: string | null
          id?: string
          observacoes?: string | null
          pontuacao_qualidade?: number | null
          reviewed_by?: string
          sprint_number?: number
          status_entrega?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprint_reviews_demand_id_fkey"
            columns: ["demand_id"]
            isOneToOne: false
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
        ]
      }
      squad_members: {
        Row: {
          cargo: string | null
          created_at: string
          empresa: string
          horas_dia: number
          id: string
          is_scrum: boolean
          squad: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cargo?: string | null
          created_at?: string
          empresa: string
          horas_dia?: number
          id?: string
          is_scrum?: boolean
          squad: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cargo?: string | null
          created_at?: string
          empresa?: string
          horas_dia?: number
          id?: string
          is_scrum?: boolean
          squad?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      squads: {
        Row: {
          ativo: boolean
          coordenador_ti_id: string | null
          created_at: string
          descricao: string | null
          empresa: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          coordenador_ti_id?: string | null
          created_at?: string
          descricao?: string | null
          empresa: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          coordenador_ti_id?: string | null
          created_at?: string
          descricao?: string | null
          empresa?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_access_groups: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_access_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "access_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_log: {
        Row: {
          action: string
          changed_by: string | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_custom_permissions: {
        Row: {
          action: Database["public"]["Enums"]["permission_action"]
          created_at: string | null
          granted: boolean | null
          id: string
          resource: Database["public"]["Enums"]["permission_resource"]
          user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["permission_action"]
          created_at?: string | null
          granted?: boolean | null
          id?: string
          resource: Database["public"]["Enums"]["permission_resource"]
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["permission_action"]
          created_at?: string | null
          granted?: boolean | null
          id?: string
          resource?: Database["public"]["Enums"]["permission_resource"]
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      copy_user_permissions: {
        Args: { _source_user_id: string; _target_user_id: string }
        Returns: undefined
      }
      generate_new_demand_code: {
        Args: { p_created_at?: string; p_empresa: string }
        Returns: string
      }
      get_manager_empresa: { Args: { _user_id: string }; Returns: string }
      get_solicitante_empresa: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_committee_member: { Args: { _user_id: string }; Returns: boolean }
      is_project_manager: { Args: { _user_id: string }; Returns: boolean }
      user_has_empresa_access: {
        Args: { _empresa: string; _nivel?: string; _user_id: string }
        Returns: boolean
      }
      user_has_permission: {
        Args: {
          _action: Database["public"]["Enums"]["permission_action"]
          _resource: Database["public"]["Enums"]["permission_resource"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      action_type:
        | "criar"
        | "editar"
        | "reativar"
        | "excluir"
        | "cancelar"
        | "arquivar"
        | "aprovar"
        | "reprovar"
        | "mudar_status"
        | "adicionar_fase"
        | "atualizar_fase"
        | "solicitar_insumo"
        | "enviar_notificacao"
        | "solicitar_aprovacao_gerente"
        | "aprovar_gerente"
        | "recusar_gerente"
        | "aprovar_comite"
        | "recusar_comite"
        | "aprovar_ti"
        | "recusar_ti"
        | "registrar_daily"
        | "mudanca_escopo"
      app_role: "admin" | "manager" | "tech_lead" | "developer" | "user"
      approval_level: "gerente" | "comite" | "ti"
      approval_status: "pendente" | "aprovado" | "recusado"
      demand_action:
        | "adicionar_fase"
        | "aprovar"
        | "aprovar_comite"
        | "aprovar_gerente"
        | "aprovar_ti"
        | "arquivar"
        | "atualizar_fase"
        | "cancelar"
        | "criar"
        | "editar"
        | "enviar_notificacao"
        | "iniciar_aprovacao"
        | "mudanca_escopo"
        | "mudanca_status"
        | "recusar"
        | "remover_fase"
        | "reprovar"
        | "reverter_faseamento"
        | "solicitar_insumo"
        | "solicitar_mudanca"
      demand_priority: "Baixa" | "Média" | "Alta" | "Crítica"
      demand_status:
        | "Backlog"
        | "Refinamento_TI"
        | "Aguardando_Planning"
        | "Em_Analise_Comite"
        | "Aprovado"
        | "Em_Progresso"
        | "Revisao"
        | "Concluido"
        | "StandBy"
        | "Nao_Entregue"
        | "Em_Avaliacao_PMO"
        | "Aguardando_Comite"
        | "Arquivado"
        | "Aguardando_Gerente"
        | "Aguardando_Validacao_TI"
        | "Recusado"
        | "Bloqueado"
        | "Aprovado_GP"
      empresa_type: "ZC" | "Eletro" | "ZF" | "ZS"
      fornecedor_status: "ativo" | "inativo"
      functional_requirement_signature_status:
        | "pendente"
        | "assinado"
        | "rejeitado"
      functional_requirement_status:
        | "rascunho"
        | "pendente"
        | "assinado"
        | "rejeitado"
      permission_action:
        | "view"
        | "create"
        | "edit"
        | "delete"
        | "approve"
        | "manage"
      permission_resource:
        | "dashboard"
        | "criar_demanda"
        | "minhas_solicitacoes"
        | "historico_acoes"
        | "demandas_finalizadas"
        | "kanban_empresa"
        | "backlog_empresa"
        | "progresso_empresa"
        | "concluidas_empresa"
        | "arquivadas_empresa"
        | "gestao_riscos_empresa"
        | "aguardando_validacao"
        | "aguardando_insumos"
        | "standby"
        | "pareceres_pendentes"
        | "faseamento"
        | "estimativas"
        | "retrospectiva"
        | "planning"
        | "agenda_reviews"
        | "agenda_planning"
        | "atualizacao_demandas"
        | "aprovacoes"
        | "permissoes"
        | "relatorios"
        | "coordenador_ti"
      project_type: "Tradicional" | "Agil"
      setor_type:
        | "Planejamento"
        | "Fiscal"
        | "Contabilidade"
        | "Ecommerce"
        | "Financeiro"
        | "Comercial"
        | "Auditoria"
        | "Compras"
        | "RH e DP"
        | "Tecnologia da Informação"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      action_type: [
        "criar",
        "editar",
        "reativar",
        "excluir",
        "cancelar",
        "arquivar",
        "aprovar",
        "reprovar",
        "mudar_status",
        "adicionar_fase",
        "atualizar_fase",
        "solicitar_insumo",
        "enviar_notificacao",
        "solicitar_aprovacao_gerente",
        "aprovar_gerente",
        "recusar_gerente",
        "aprovar_comite",
        "recusar_comite",
        "aprovar_ti",
        "recusar_ti",
        "registrar_daily",
        "mudanca_escopo",
      ],
      app_role: ["admin", "manager", "tech_lead", "developer", "user"],
      approval_level: ["gerente", "comite", "ti"],
      approval_status: ["pendente", "aprovado", "recusado"],
      demand_action: [
        "adicionar_fase",
        "aprovar",
        "aprovar_comite",
        "aprovar_gerente",
        "aprovar_ti",
        "arquivar",
        "atualizar_fase",
        "cancelar",
        "criar",
        "editar",
        "enviar_notificacao",
        "iniciar_aprovacao",
        "mudanca_escopo",
        "mudanca_status",
        "recusar",
        "remover_fase",
        "reprovar",
        "reverter_faseamento",
        "solicitar_insumo",
        "solicitar_mudanca",
      ],
      demand_priority: ["Baixa", "Média", "Alta", "Crítica"],
      demand_status: [
        "Backlog",
        "Refinamento_TI",
        "Aguardando_Planning",
        "Em_Analise_Comite",
        "Aprovado",
        "Em_Progresso",
        "Revisao",
        "Concluido",
        "StandBy",
        "Nao_Entregue",
        "Em_Avaliacao_PMO",
        "Aguardando_Comite",
        "Arquivado",
        "Aguardando_Gerente",
        "Aguardando_Validacao_TI",
        "Recusado",
        "Bloqueado",
        "Aprovado_GP",
      ],
      empresa_type: ["ZC", "Eletro", "ZF", "ZS"],
      fornecedor_status: ["ativo", "inativo"],
      functional_requirement_signature_status: [
        "pendente",
        "assinado",
        "rejeitado",
      ],
      functional_requirement_status: [
        "rascunho",
        "pendente",
        "assinado",
        "rejeitado",
      ],
      permission_action: [
        "view",
        "create",
        "edit",
        "delete",
        "approve",
        "manage",
      ],
      permission_resource: [
        "dashboard",
        "criar_demanda",
        "minhas_solicitacoes",
        "historico_acoes",
        "demandas_finalizadas",
        "kanban_empresa",
        "backlog_empresa",
        "progresso_empresa",
        "concluidas_empresa",
        "arquivadas_empresa",
        "gestao_riscos_empresa",
        "aguardando_validacao",
        "aguardando_insumos",
        "standby",
        "pareceres_pendentes",
        "faseamento",
        "estimativas",
        "retrospectiva",
        "planning",
        "agenda_reviews",
        "agenda_planning",
        "atualizacao_demandas",
        "aprovacoes",
        "permissoes",
        "relatorios",
        "coordenador_ti",
      ],
      project_type: ["Tradicional", "Agil"],
      setor_type: [
        "Planejamento",
        "Fiscal",
        "Contabilidade",
        "Ecommerce",
        "Financeiro",
        "Comercial",
        "Auditoria",
        "Compras",
        "RH e DP",
        "Tecnologia da Informação",
      ],
    },
  },
} as const
