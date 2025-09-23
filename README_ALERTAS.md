# Sistema de Alertas para Tarefas Atrasadas

## Funcionalidades Implementadas

### 🚨 **Etiquetas de Atraso**
- **Etiqueta visual** nas tarefas atrasadas com ícone de alerta
- **Contador de dias** em atraso (ex: "3 dias atrasado")
- **Cor vermelha** para destacar visualmente as tarefas atrasadas

### 📢 **Alertas Globais**
- **Alerta no canto superior direito** quando há tarefas atrasadas
- **Notificação toast** ao abrir o CRM com tarefas atrasadas
- **Lista resumida** das tarefas atrasadas no alerta
- **Botão "Ver Tarefas"** que leva diretamente para a aba de atividades

### 🎯 **Indicadores Visuais**
- **Data de vencimento** em vermelho para tarefas atrasadas
- **Texto "Atrasado"** abaixo da data
- **Alerta destacado** na lista de atividades
- **Ícones de alerta** consistentes em todo o sistema

## Como Testar

### 1. Criar Tarefa Atrasada
1. Vá para a aba "Atividades"
2. Clique em "+ Nova Atividade"
3. Preencha os campos obrigatórios:
   - **Título**: "Teste de tarefa atrasada"
   - **Data de Vencimento**: Selecione uma data passada (ex: ontem)
   - **Status**: Mantenha como "Pendente"
4. Clique em "Criar"

### 2. Verificar Alertas
1. **Recarregue a página** ou navegue para outra aba e volte
2. **Alerta toast** deve aparecer informando sobre tarefas atrasadas
3. **Alerta global** deve aparecer no canto superior direito
4. **Na aba Atividades**: a tarefa deve mostrar etiqueta de atraso

### 3. Funcionalidades do Alerta
- **"Ver Tarefas"**: Leva para a aba de atividades
- **"Dispensar"**: Remove o alerta temporariamente
- **Ícone X**: Fecha o alerta

## Código Implementado

### Hook Personalizado
- `useOverdueActivities.ts`: Gerencia lógica de tarefas atrasadas

### Componentes
- `OverdueAlert.tsx`: Alerta global de tarefas atrasadas
- `ActivitiesView.tsx`: Atualizado com etiquetas e alertas

### Funcionalidades
- ✅ Verificação automática de tarefas atrasadas
- ✅ Cálculo de dias em atraso
- ✅ Alertas visuais e sonoros
- ✅ Navegação direta para tarefas
- ✅ Interface responsiva e acessível

## Cores e Estilos
- **Vermelho**: Para indicar atraso e urgência
- **Ícones**: Triângulo de alerta para consistência visual
- **Bordas arredondadas**: Seguindo o design moderno
- **Sombras sutis**: Para destacar os alertas
