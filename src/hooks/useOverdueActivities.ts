import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";

export function useOverdueActivities() {
  const activities = useQuery(api.activities.list, {});
  const [hasShownAlert, setHasShownAlert] = useState(false);
  const [lastOverdueCount, setLastOverdueCount] = useState(0);

  // Função para verificar se uma atividade está atrasada
  const isOverdue = (dueDate: number | undefined, status: string) => {
    if (!dueDate || status === "completed" || status === "cancelled") return false;
    return new Date().getTime() > dueDate;
  };

  // Função para contar atividades atrasadas
  const getOverdueActivities = () => {
    if (!activities) return [];
    return activities.filter(activity => 
      isOverdue(activity.dueDate, activity.status)
    );
  };

  // Função para calcular dias de atraso
  const getDaysOverdue = (dueDate: number) => {
    const today = new Date().getTime();
    const diffTime = today - dueDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const overdueActivities = getOverdueActivities();

  // Efeito para detectar mudanças no número de tarefas atrasadas
  useEffect(() => {
    const currentOverdueCount = overdueActivities.length;
    
    // Se o número de tarefas atrasadas aumentou, resetar o flag de alerta
    if (currentOverdueCount > lastOverdueCount && lastOverdueCount > 0) {
      setHasShownAlert(false);
    }
    
    setLastOverdueCount(currentOverdueCount);
  }, [overdueActivities.length, lastOverdueCount]);

  return {
    overdueActivities,
    getDaysOverdue,
    isOverdue,
    hasShownAlert,
    setHasShownAlert
  };
}
