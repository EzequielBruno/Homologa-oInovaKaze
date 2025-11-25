# Documentação do Sistema de Gestão de Demandas de TI

Bem-vindo à documentação completa do Sistema de Gestão de Demandas de TI. Este conjunto de documentos fornece informações detalhadas sobre todos os aspectos do sistema, desde a arquitetura técnica até o uso final.

## 📚 Índice Geral de Documentação

### 📖 Documentação para Usuários
- [**Manual do Usuário**](MANUAL_USUARIO.md) - Guia completo para utilização do sistema
  - Como criar demandas
  - Como aprovar solicitações
  - Como acompanhar o progresso
  - Perguntas frequentes
  - Troubleshooting comum

### 🏗️ Documentação Técnica

- [**Arquitetura do Sistema**](ARQUITETURA.md) - Visão completa da arquitetura
  - Padrões arquiteturais utilizados
  - Componentes do sistema
  - Fluxo de dados
  - Decisões de design
  - Diagramas técnicos

- [**Schema do Banco de Dados**](DATABASE_SCHEMA.md) - Estrutura completa do banco
  - Tabelas e relacionamentos
  - Índices e otimizações
  - Triggers e functions
  - Políticas de segurança (RLS)
  - Queries de exemplo

- [**Documentação Técnica Completa**](DOCUMENTACAO_TECNICA.md) - Guia para desenvolvedores
  - Stack tecnológico
  - APIs e integrações
  - Componentes principais
  - Fluxos de autenticação
  - Deployment e manutenção

### 📊 Diagramas e Fluxos

- [**Diagramas e Fluxogramas**](DIAGRAMAS.md) - Visualizações do sistema
  - Ciclo de vida da demanda
  - Fluxo de aprovações
  - Integração entre componentes
  - Casos de uso UML
  - Diagramas de sequência

### 📋 Regras de Negócio do Kanban

- [**Regras de Ações do Kanban**](kanban-action-rules.md) - Quais ações estão disponíveis em cada coluna
- [**Transição Automática**](kanban-auto-transition.md) - Como funciona a transição automática
- [**Regras de Fluxo do Kanban**](kanban-flow-rules.md) - Regras de transição entre colunas

### 📄 Documentação Institucional

- [**Memorial Descritivo**](MEMORIAL_DESCRITIVO.md) - Descrição formal do sistema
  - Identificação da obra
  - Características técnicas
  - Funcionalidades principais
  - Inovações implementadas

- [**Relatório Executivo**](RELATORIO_EXECUTIVO.md) - Visão executiva e de negócios
  - Principais características
  - Benefícios e ROI
  - Comparativo com mercado
  - Casos de uso reais

- [**Registro no INPI**](REGISTRO_INPI.md) - Documentação para registro de software
  - Dados necessários
  - Passo a passo
  - Checklist de documentos

### 🔧 Documentação de Correções

- [**Correções de Permissões**](CORRECOES_PERMISSOES.md) - Histórico de correções no sistema de permissões

- [**Mapeamento Completo**](MAPEAMENTO_COMPLETO.md) - Mapeamento de tabelas, campos e uso no código

---

## 🎯 Por Onde Começar?

### Se você é um **Usuário Final**:
1. Leia o [Manual do Usuário](MANUAL_USUARIO.md)
2. Consulte a seção de Perguntas Frequentes
3. Veja os [Diagramas](DIAGRAMAS.md) para entender o fluxo

### Se você é um **Gerente/Decisor**:
1. Leia o [Relatório Executivo](RELATORIO_EXECUTIVO.md)
2. Consulte o [Memorial Descritivo](MEMORIAL_DESCRITIVO.md) para detalhes formais
3. Veja o ROI e benefícios documentados

### Se você é um **Desenvolvedor**:
1. Leia a [Arquitetura do Sistema](ARQUITETURA.md)
2. Consulte o [Schema do Banco](DATABASE_SCHEMA.md)
3. Veja a [Documentação Técnica](DOCUMENTACAO_TECNICA.md) para detalhes de implementação

### Se você é um **Administrador de Sistema**:
1. Leia a [Documentação Técnica](DOCUMENTACAO_TECNICA.md)
2. Consulte as seções de deployment e manutenção
3. Veja as políticas de segurança no [Schema do Banco](DATABASE_SCHEMA.md)

---

## 📝 Convenções da Documentação

### Símbolos Utilizados
- ✅ Funcionalidade implementada
- 🚀 Novo recurso
- ⚠️ Atenção importante
- 💡 Dica útil
- 🔒 Relacionado à segurança
- 🎯 Objetivo ou meta
- 📊 Relacionado a dados/métricas
- 🔧 Técnico/Configuração

### Formatação de Código

#### Exemplos SQL:
```sql
SELECT * FROM demands WHERE status = 'Aprovado';
```

#### Exemplos TypeScript/React:
```typescript
const handleApprove = async () => {
  // código aqui
};
```

#### Exemplos de Configuração:
```yaml
key: value
```

---

## 🔄 Atualização da Documentação

Esta documentação é mantida atualizada com o sistema. A última atualização foi realizada em **2025**.

### Versionamento
- **Versão do Sistema**: 1.0.0
- **Versão da Documentação**: 1.0.0
- **Data da Última Atualização**: 2025

---

## 📧 Suporte

Para dúvidas ou sugestões sobre a documentação:
- Email: [PREENCHER]
- Documentação online: [PREENCHER]
- Suporte técnico: [PREENCHER]

---

## 📜 Licença e Direitos Autorais

**Sistema de Gestão de Demandas de TI**  
Copyright © 2025 [PREENCHER]  
Todos os direitos reservados.

Esta documentação é proprietária e confidencial. Qualquer reprodução, distribuição ou uso não autorizado é estritamente proibido.

---

## 🎓 Glossário de Termos

- **Demanda**: Solicitação de desenvolvimento ou melhoria de software
- **Backlog**: Fila de demandas aguardando início
- **Sprint**: Ciclo de desenvolvimento de 1-4 semanas
- **Squad**: Equipe de desenvolvimento
- **Kanban**: Metodologia visual de gestão de trabalho
- **RLS**: Row Level Security (segurança em nível de linha)
- **RBAC**: Role-Based Access Control (controle de acesso baseado em papéis)
- **SPA**: Single Page Application (aplicação de página única)
- **API**: Application Programming Interface (interface de programação)
- **JWT**: JSON Web Token (token web JSON)

---

## 📈 Histórico de Versões da Documentação

| Versão | Data | Descrição |
|--------|------|-----------|
| 1.0.0  | 2025 | Documentação inicial completa com todos os módulos |

---

**Nota**: Este documento serve como índice principal. Para informações detalhadas, consulte os documentos específicos listados acima.
