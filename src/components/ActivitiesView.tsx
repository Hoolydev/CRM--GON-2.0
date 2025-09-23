import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useOverdueActivities } from "../hooks/useOverdueActivities";

export function ActivitiesView() {
  const activities = useQuery(api.activities.list, {});
  const contacts = useQuery(api.contacts.list, {});
  const companies = useQuery(api.companies.list);
  const opportunities = useQuery(api.opportunities.list, {});
  const createActivity = useMutation(api.activities.create);
  const updateActivity = useMutation(api.activities.update);
  const completeActivity = useMutation(api.activities.complete);
  const removeActivity = useMutation(api.activities.remove);

  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [showOverdueAlert, setShowOverdueAlert] = useState(false);
  
  const { overdueActivities, getDaysOverdue, isOverdue } = useOverdueActivities();
  const [formData, setFormData] = useState({
    type: "task" as "call" | "email" | "meeting" | "task" | "note",
    title: "",
    description: "",
    status: "pending" as "pending" | "completed" | "cancelled",
    dueDate: "",
    contactId: "",
    companyId: "",
    opportunityId: "",
  });

  const activityTypes = [
    { value: "call", label: "Ligação", icon: "📞" },
    { value: "email", label: "Email", icon: "📧" },
    { value: "meeting", label: "Reunião", icon: "🤝" },
    { value: "task", label: "Tarefa", icon: "✅" },
    { value: "note", label: "Nota", icon: "📝" },
  ];

  const resetForm = () => {
    setFormData({
      type: "task",
      title: "",
      description: "",
      status: "pending",
      dueDate: "",
      contactId: "",
      companyId: "",
      opportunityId: "",
    });
    setEditingActivity(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData = {
        type: formData.type,
        title: formData.title,
        description: formData.description || undefined,
        status: formData.status,
        dueDate: formData.dueDate ? new Date(formData.dueDate).getTime() : undefined,
        contactId: formData.contactId ? formData.contactId as any : undefined,
        companyId: formData.companyId ? formData.companyId as any : undefined,
        opportunityId: formData.opportunityId ? formData.opportunityId as any : undefined,
      };

      if (editingActivity) {
        await updateActivity({
          id: editingActivity._id,
          ...submitData,
        });
        toast.success("Atividade atualizada com sucesso!");
      } else {
        await createActivity(submitData);
        toast.success("Atividade criada com sucesso!");
      }
      resetForm();
    } catch (error) {
      toast.error("Erro ao salvar atividade");
    }
  };

  const handleEdit = (activity: any) => {
    setFormData({
      type: activity.type || "task",
      title: activity.title || "",
      description: activity.description || "",
      status: activity.status || "pending",
      dueDate: activity.dueDate 
        ? new Date(activity.dueDate).toISOString().split('T')[0]
        : "",
      contactId: activity.contactId || "",
      companyId: activity.companyId || "",
      opportunityId: activity.opportunityId || "",
    });
    setEditingActivity(activity);
    setShowForm(true);
  };

  const handleComplete = async (id: string) => {
    try {
      await completeActivity({ id: id as any });
      toast.success("Atividade marcada como concluída!");
    } catch (error) {
      toast.error("Erro ao completar atividade");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta atividade?")) {
      try {
        await removeActivity({ id: id as any });
        toast.success("Atividade excluída com sucesso!");
      } catch (error) {
        toast.error("Erro ao excluir atividade");
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    
    const labels = {
      pending: "Pendente",
      completed: "Concluída",
      cancelled: "Cancelada",
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    const typeInfo = activityTypes.find(t => t.value === type);
    return typeInfo ? typeInfo.icon : "📝";
  };

  // Efeito para mostrar alerta de tarefas atrasadas
  useEffect(() => {
    if (overdueActivities.length > 0) {
      setShowOverdueAlert(true);
      toast.error(
        `⚠️ Você tem ${overdueActivities.length} tarefa${overdueActivities.length > 1 ? 's' : ''} atrasada${overdueActivities.length > 1 ? 's' : ''}!`,
        {
          duration: 5000,
        }
      );
    }
  }, [overdueActivities]);

  if (!activities || !contacts || !companies || !opportunities) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow h-24"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Alerta de Tarefas Atrasadas */}
      {showOverdueAlert && overdueActivities.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-800">
                  Tarefas Atrasadas
                </h3>
                <p className="text-sm text-red-600">
                  Você tem {overdueActivities.length} tarefa{overdueActivities.length > 1 ? 's' : ''} em atraso
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowOverdueAlert(false)}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Atividades</h1>
          <p className="text-gray-600 mt-2">Gerencie suas tarefas e atividades</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nova Atividade
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingActivity ? "Editar Atividade" : "Nova Atividade"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {activityTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Pendente</option>
                    <option value="completed">Concluída</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Vencimento
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contato
                  </label>
                  <select
                    value={formData.contactId}
                    onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione um contato...</option>
                    {contacts.map((contact) => (
                      <option key={contact._id} value={contact._id}>
                        {contact.firstName} {contact.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Empresa
                  </label>
                  <select
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione uma empresa...</option>
                    {companies.map((company) => (
                      <option key={company._id} value={company._id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Oportunidade
                  </label>
                  <select
                    value={formData.opportunityId}
                    onChange={(e) => setFormData({ ...formData, opportunityId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione uma oportunidade...</option>
                    {opportunities.map((opportunity) => (
                      <option key={opportunity._id} value={opportunity._id}>
                        {opportunity.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingActivity ? "Atualizar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activities List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {activities.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma atividade cadastrada</h3>
            <p className="text-gray-600 mb-4">Comece criando sua primeira atividade</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Criar Primeira Atividade
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Atividade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Relacionado a
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activities.map((activity) => (
                  <tr key={activity._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-3">{getTypeIcon(activity.type)}</span>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <div className="text-sm font-medium text-gray-900">{activity.title}</div>
                            {isOverdue(activity.dueDate, activity.status) && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                {getDaysOverdue(activity.dueDate!)} dia{getDaysOverdue(activity.dueDate!) > 1 ? 's' : ''} atrasado
                              </span>
                            )}
                          </div>
                          {activity.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {activity.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {activity.contactName && (
                          <div>👤 {activity.contactName}</div>
                        )}
                        {activity.companyName && (
                          <div>🏢 {activity.companyName}</div>
                        )}
                        {activity.opportunityTitle && (
                          <div>💰 {activity.opportunityTitle}</div>
                        )}
                        {!activity.contactName && !activity.companyName && !activity.opportunityTitle && "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(activity.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {activity.dueDate ? (
                        <div className={`text-sm ${isOverdue(activity.dueDate, activity.status) ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                          {new Date(activity.dueDate).toLocaleDateString('pt-BR')}
                          {isOverdue(activity.dueDate, activity.status) && (
                            <div className="text-xs text-red-500">
                              Atrasado
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-900">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {activity.status === "pending" && (
                        <button
                          onClick={() => handleComplete(activity._id)}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          Concluir
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(activity)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(activity._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
