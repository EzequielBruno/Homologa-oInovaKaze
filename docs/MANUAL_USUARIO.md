# Manual do Usuário
## Sistema de Gestão de Demandas de TI

---

## Índice

1. [Introdução](#1-introdução)
2. [Como Acessar o Sistema](#2-como-acessar-o-sistema)
3. [Primeiro Acesso](#3-primeiro-acesso)
4. [Navegação Básica](#4-navegação-básica)
5. [Criando uma Demanda](#5-criando-uma-demanda)
6. [Aprovando Demandas](#6-aprovando-demandas)
7. [Acompanhando Demandas](#7-acompanhando-demandas)
8. [Visualização Kanban](#8-visualização-kanban)
9. [Relatórios e Dashboard](#9-relatórios-e-dashboard)
10. [Perfis e Permissões](#10-perfis-e-permissões)
11. [Perguntas Frequentes](#11-perguntas-frequentes)

---

## 1. Introdução

### O que é o Sistema?

O Sistema de Gestão de Demandas de TI é uma plataforma web que permite:

- **Solicitantes**: Criar pedidos de desenvolvimento de software
- **Gerentes**: Aprovar ou recusar solicitações da sua área
- **Comitê**: Avaliar viabilidade estratégica
- **TI**: Estimar esforço, planejar e executar projetos
- **Todos**: Acompanhar o progresso em tempo real

### Benefícios

✅ **Organização**: Todas as demandas em um só lugar  
✅ **Rastreabilidade**: Histórico completo de cada solicitação  
✅ **Transparência**: Status atualizado em tempo real  
✅ **Controle**: Aprovações estruturadas em múltiplos níveis  
✅ **Métricas**: Relatórios e dashboards para tomada de decisão  

---

## 2. Como Acessar o Sistema

### Requisitos

- Navegador moderno (Chrome, Firefox, Safari ou Edge)
- Conexão com internet
- Usuário e senha fornecidos pelo administrador

### URL de Acesso

```
https://[seu-dominio].com
```

### Tela de Login

1. Acesse a URL do sistema
2. Digite seu **e-mail**
3. Digite sua **senha**
4. Clique em **"Entrar"**

**💡 Dica**: Se esqueceu sua senha, clique em "Esqueci minha senha" e siga as instruções por e-mail.

---

## 3. Primeiro Acesso

### Após o Login

1. Você verá o **Dashboard** com um resumo de demandas
2. No lado esquerdo está o **Menu de Navegação**
3. No topo direito está seu **nome** e o **sino de notificações**

### Alterar Senha (Recomendado)

1. Clique no seu nome no canto superior direito
2. Selecione "Meu Perfil"
3. Clique em "Alterar Senha"
4. Digite a senha atual
5. Digite a nova senha (mínimo 6 caracteres)
6. Confirme a nova senha
7. Clique em "Salvar"

---

## 4. Navegação Básica

### Menu Principal (Sidebar)

O menu é organizado por categorias:

**📊 Dashboard**
- Visão geral do sistema

**📝 Demandas**
- Minhas Solicitações
- Criar Demanda
- Backlog
- Em Progresso
- Concluídas
- Histórico de Ações

**✅ Aprovações**
- Pendentes de Aprovação (se você for aprovador)

**⚠️ Atenção**
- Aguardando Insumos
- Stand By
- Aguardando Validação

**🏢 Empresa** (se aplicável)
- Demandas da Empresa
- Kanban
- Arquivadas

**🔧 Técnico** (apenas TI)
- Pareceres Pendentes
- Estimativas
- Faseamento

**📅 Cerimônias** (apenas TI/Tech Lead)
- Planning
- Reviews
- Dailys
- Retrospectiva

**📈 Relatórios** (gerentes e acima)
- Dashboard de Relatórios

**⚙️ Configurações** (apenas Admin)
- Permissões

### Barra Superior

**🔔 Sino de Notificações**
- Clique para ver notificações recentes
- Badge vermelho indica quantas não lidas

**👤 Nome do Usuário**
- Clique para ver menu de perfil
- Opção de sair do sistema

---

## 5. Criando uma Demanda

### Passo a Passo

1. **Acesse o Menu**
   - Clique em "Demandas" > "Criar Demanda"

2. **Preencha o Formulário**

   **Campos Obrigatórios** (marcados com *):
   
   - **Empresa**: Selecione sua empresa
   - **Squad**: Selecione o time responsável
   - **Descrição**: Descreva claramente o que você precisa
   - **Prioridade**: Selecione a urgência
     - Baixa: Pode esperar
     - Média: Importante mas não urgente
     - Alta: Urgente
     - Crítica: Bloqueador, precisa ser feito imediatamente

   **Campos Opcionais**:
   
   - **Requisitos Funcionais**: Detalhe como deve funcionar
   - **Documentos e Fluxogramas**: Anexe arquivos (PDF, PNG, JPG, DOCX)
   - **Demanda Regulatória**: Ative se for obrigação legal
   - **Data Limite Regulatória**: Se marcou regulatória, informe o prazo
   - **Observações**: Qualquer informação adicional

3. **Anexar Arquivos** (opcional)
   - Clique em "Upload de Arquivos"
   - Arraste arquivos ou clique para selecionar
   - Formatos aceitos: PDF, PNG, JPG, JPEG, DOCX, XLSX
   - Tamanho máximo: 10MB por arquivo

4. **Revisar Informações**
   - Confira todos os campos antes de salvar

5. **Salvar**
   - Clique em "Salvar"
   - Aguarde a confirmação
   - Você verá uma mensagem de sucesso

### Após Criar

- A demanda recebe um **código único** (ex: EMP01-2025-0001)
- Status inicial: **"Aguardando Aprovação Gerencial"**
- Seu gerente recebe uma **notificação**
- Você pode acompanhar em **"Minhas Solicitações"**

### 💡 Dicas para uma Boa Demanda

✅ **Seja específico**: Quanto mais detalhes, melhor  
✅ **Anexe documentos**: Ajuda a equipe técnica entender  
✅ **Prioridade correta**: Não marque tudo como crítico  
✅ **Requisitos claros**: Descreva o comportamento esperado  

---

## 6. Aprovando Demandas

### Quem Aprova?

O sistema possui **3 níveis de aprovação**:

1. **Gerente**: Aprova demandas da sua área
2. **Comitê**: Avalia viabilidade estratégica
3. **TI**: Validação técnica final

### Como Aprovar

1. **Acesse Aprovações**
   - Menu > "Aprovações"
   - Você verá apenas demandas do seu nível

2. **Visualize a Demanda**
   - Clique no card da demanda
   - Leia atentamente:
     - Descrição
     - Requisitos
     - Prioridade
     - Anexos (se houver)
     - Histórico

3. **Tome uma Ação**

   Você tem 3 opções:

   **✅ Aprovar**
   - Se concorda com a demanda
   - Pode adicionar comentário (opcional)
   - Demanda passa para próximo nível

   **❌ Recusar**
   - Se não concorda ou não é viável
   - **Comentário é obrigatório** (explique o motivo)
   - Demanda volta para o solicitante

   **📋 Solicitar Insumos**
   - Se precisa de mais informações
   - **Comentário é obrigatório** (diga o que falta)
   - Demanda fica aguardando o solicitante complementar

4. **Confirme a Ação**
   - Revise seu comentário
   - Clique em "Confirmar"
   - Aguarde a confirmação

### Após Aprovar

- Solicitante recebe **notificação**
- Demanda move para **próxima etapa**
- Ação fica registrada no **histórico**

### 💡 Boas Práticas

✅ **Seja claro**: Comentários ajudam todos entenderem o contexto  
✅ **Seja rápido**: Demandas paradas atrasam projetos  
✅ **Solicite quando necessário**: Melhor pedir mais informações que aprovar algo incompleto  

---

## 7. Acompanhando Demandas

### Minhas Solicitações

**Menu > Demandas > Minhas Solicitações**

Aqui você vê **todas as demandas que você criou**, independente do status.

**Informações Exibidas**:
- Código da demanda
- Empresa e Squad
- Descrição resumida
- Prioridade
- Status atual
- Data de criação

### Status Possíveis

| Status | Significado |
|--------|-------------|
| 🟡 Rascunho | Ainda não enviada |
| 🟠 Aguardando Aprovação Gerencial | Com seu gerente |
| 🟠 Aguardando Comitê | Com o comitê técnico |
| 🟠 Aguardando TI | Com a equipe de TI |
| 🟢 Aprovada | Aprovada em todos níveis |
| 🔴 Recusada | Não aprovada em algum nível |
| 🔵 Backlog | Aprovada, aguardando início |
| 🔵 Em Análise Técnica | TI analisando complexidade |
| 🟣 Em Desenvolvimento | Sendo desenvolvida |
| 🟣 Em Homologação | Em testes |
| 🟡 Aguardando Insumos | Precisa complementar informações |
| 🟡 Aguardando Validação | Aguardando você aprovar entrega |
| ⚫ Stand By | Pausada temporariamente |
| ✅ Concluída | Finalizada |
| 📦 Arquivada | Arquivada (cancelada ou substituída) |

### Ver Detalhes

1. Clique em qualquer demanda
2. Você verá:
   - **Informações Completas**
   - **Anexos** (se houver)
   - **Histórico de Ações**
   - **Aprovações** (quem aprovou/recusou)
   - **Fases** (se projeto faseado)

### Histórico de Ações

Cada demanda tem um **histórico completo**:

- Quem criou
- Quem aprovou em cada nível
- Quem recusou (e por quê)
- Quem solicitou insumos
- Mudanças de status
- Comentários

**Visualizar Histórico**:
- Menu > Demandas > Histórico de Ações
- Ou dentro da demanda, aba "Histórico"

---

## 8. Visualização Kanban

### O que é Kanban?

É uma visualização em **colunas** que mostra demandas em execução.

### Como Acessar

**Menu > Empresa > Kanban**

### Colunas do Kanban

- **Backlog**: Aprovadas, aguardando início
- **Em Análise**: TI avaliando complexidade
- **Em Desenvolvimento**: Sendo desenvolvidas
- **Em Homologação**: Em testes
- **Concluídas**: Finalizadas

### Filtros

No topo da tela você pode filtrar por:

- **Empresa**: Ver demandas de uma empresa específica
- **Squad**: Ver demandas de um time específico

### Cards no Kanban

Cada card mostra:
- Código da demanda
- Título/Descrição resumida
- Prioridade (cor do badge)
- Squad responsável
- Horas estimadas (se definido)

### Arrastar Cards (apenas TI/Tech Lead)

Se você tem permissão:
1. Clique e segure em um card
2. Arraste para a coluna desejada
3. Solte o card
4. Status é atualizado automaticamente

---

## 9. Relatórios e Dashboard

### Dashboard Principal

**Menu > Dashboard**

Visão geral com:

**KPIs Principais**:
- Total de Demandas
- Demandas Ativas
- Horas Totais Estimadas
- Custo Total Estimado
- Taxa de Conclusão

**Gráficos**:
- Demandas por Status
- Demandas por Prioridade
- Demandas por Empresa
- Tendência ao Longo do Tempo

### Relatórios Detalhados

**Menu > Relatórios** (apenas para gerentes e acima)

**Abas Disponíveis**:

1. **Visão Geral**
   - Resumo geral de todas demandas
   - Gráficos de status e prioridade

2. **Por Empresa**
   - Demandas separadas por empresa
   - Custos por empresa
   - Comparativo entre empresas

3. **Por Squad**
   - Horas trabalhadas por squad
   - Produtividade por squad
   - Capacidade vs demanda

4. **Performance**
   - Tempo médio de aprovação
   - Tempo médio de execução
   - Acurácia de estimativas
   - Taxa de retrabalho

### Filtros de Relatórios

Você pode filtrar por:
- Período (data início e fim)
- Empresa
- Squad
- Status
- Prioridade

---

## 10. Perfis e Permissões

### Tipos de Usuário

**👤 Solicitante**
- Criar demandas
- Ver suas demandas
- Receber notificações

**👔 Gerente**
- Todas as permissões de Solicitante
- Aprovar demandas da sua área
- Ver demandas da sua empresa

**🏛️ Comitê**
- Ver todas as demandas
- Aprovar no nível de comitê
- Ver relatórios

**💻 TI / Tech Lead**
- Ver todas as demandas
- Fazer parecer técnico
- Estimar horas e custos
- Fasear projetos
- Gerenciar Kanban
- Agendar cerimônias

**🔧 Desenvolvedor**
- Ver demandas atribuídas
- Atualizar status de execução

**⚙️ Admin**
- Todas as permissões
- Gerenciar usuários
- Configurar permissões

### Como Saber Meu Perfil?

1. Clique no seu nome no canto superior direito
2. Seu(s) papel(éis) aparecem abaixo do nome

### Solicitar Mudança de Perfil

Se precisar de mais permissões:
1. Fale com seu gestor ou
2. Abra chamado para o TI

---

## 11. Perguntas Frequentes

### ❓ Como sei se minha demanda foi aprovada?

Você recebe uma **notificação** (sino no topo) e um **e-mail** (se configurado). Também pode verificar em "Minhas Solicitações" - o status muda para "Aprovada" ou para o próximo nível de aprovação.

### ❓ Posso editar uma demanda depois de criada?

**Sim**, mas **apenas se ainda não foi aprovada**. Demandas aprovadas só podem ser editadas pelo TI para ajustar estimativas e fases.

### ❓ O que fazer se solicitarem insumos?

1. Acesse "Demandas" > "Aguardando Insumos"
2. Abra a demanda
3. Veja o comentário do aprovador (diz o que está faltando)
4. Edite a demanda e complemente
5. A demanda volta automaticamente para aprovação

### ❓ Como anexar arquivos?

Na tela de criação/edição da demanda:
1. Role até "Documentos e Fluxogramas"
2. Clique em "Upload de Arquivos"
3. Arraste arquivos ou clique para selecionar
4. Aguarde o upload completar (ícone verde)

### ❓ Posso ver demandas de outras pessoas?

**Depende do seu perfil**:
- **Solicitante**: Apenas suas demandas
- **Gerente**: Demandas da sua empresa
- **Comitê/TI/Admin**: Todas as demandas

### ❓ Como priorizar entre várias demandas?

A priorização é feita pelo **Comitê** e **Tech Lead** baseado em:
- Urgência (demandas regulatórias têm prioridade)
- Impacto no negócio
- Complexidade técnica
- Recursos disponíveis

### ❓ Quanto tempo leva para aprovar?

**Não há prazo fixo**, mas o ideal é:
- Gerente: 2-3 dias úteis
- Comitê: 1 semana (reuniões semanais)
- TI: 3-5 dias úteis (para estimativa)

### ❓ Como sei quando minha demanda será desenvolvida?

Após todas as aprovações:
1. Demanda vai para **Backlog**
2. Tech Lead prioriza e agenda na **Planning**
3. Você recebe notificação quando mudar para "Em Desenvolvimento"
4. Pode acompanhar progresso no **Kanban**

### ❓ Posso cancelar uma demanda?

**Não diretamente**. Para cancelar:
1. Contate seu gerente ou TI
2. Eles podem arquivar a demanda
3. A demanda fica marcada como "Arquivada"

### ❓ O sistema funciona no celular?

**Sim!** O sistema é responsivo. Acesse pelo navegador do celular normalmente.

### ❓ Esqueci minha senha, o que faço?

1. Na tela de login, clique em "Esqueci minha senha"
2. Digite seu e-mail
3. Você receberá link para redefinir
4. Clique no link e crie nova senha

### ❓ O que significa "demanda regulatória"?

São demandas que a empresa é **obrigada por lei** a fazer (ex: LGPD, PCI-DSS, Bacen). Elas têm:
- Prazo limite definido
- Prioridade automática alta
- Alertas se estiver perto do prazo

### ❓ Como tirar dúvidas técnicas?

Para dúvidas sobre:
- **Uso do sistema**: Consulte este manual ou pergunte ao TI
- **Uma demanda específica**: Comente na própria demanda ou fale com o Tech Lead
- **Problemas técnicos**: Abra chamado para o TI

---

## Suporte

Para suporte técnico ou dúvidas:

📧 **E-mail**: [seu-email@empresa.com]  
📞 **Telefone**: [seu-telefone]  
💬 **Chat**: [link se tiver]

---

## Glossário

- **Demanda**: Solicitação de desenvolvimento de software
- **Backlog**: Lista de demandas aprovadas aguardando execução
- **Kanban**: Quadro visual para acompanhar demandas em execução
- **Sprint**: Período de desenvolvimento (geralmente 2 semanas)
- **Squad**: Time responsável por uma demanda
- **Estimativa**: Previsão de horas necessárias para desenvolver
- **Faseamento**: Divisão de demanda grande em partes menores
- **Parecer Técnico**: Análise da viabilidade técnica feita pelo TI
- **Dashboard**: Painel com visão geral e métricas
- **RLS**: Row Level Security (segurança que filtra dados por usuário)
- **Status**: Situação atual da demanda no fluxo

---

**Versão do Manual**: 1.0  
**Data**: 06/10/2025  
**Última Atualização**: [PREENCHER]
