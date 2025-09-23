import { useOverdueActivities } from "../hooks/useOverdueActivities";

interface OverdueAlertProps {
  onClose: () => void;
  onDismiss: () => void;
}

export function OverdueAlert({ onClose, onDismiss }: OverdueAlertProps) {
  const { overdueActivities, getDaysOverdue } = useOverdueActivities();

  if (overdueActivities.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-800 mb-1">
              Tarefas Atrasadas
            </h3>
            <p className="text-sm text-red-600 mb-3">
              Você tem {overdueActivities.length} tarefa{overdueActivities.length > 1 ? 's' : ''} em atraso:
            </p>
            
            <div className="space-y-2 mb-3">
              {overdueActivities.slice(0, 3).map((activity) => (
                <div key={activity._id} className="text-xs text-red-700">
                  • {activity.title} ({getDaysOverdue(activity.dueDate!)} dias atrasado)
                </div>
              ))}
              {overdueActivities.length > 3 && (
                <div className="text-xs text-red-600">
                  ... e mais {overdueActivities.length - 3} tarefa{overdueActivities.length - 3 > 1 ? 's' : ''}
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={onClose}
                className="text-xs bg-red-100 text-red-800 px-3 py-1 rounded-lg hover:bg-red-200 transition-colors"
              >
                Ver Tarefas
              </button>
              <button
                onClick={onDismiss}
                className="text-xs text-red-600 hover:text-red-800 transition-colors"
              >
                Dispensar
              </button>
            </div>
          </div>
          
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
