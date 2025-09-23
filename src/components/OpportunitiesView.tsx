import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export function OpportunitiesView() {
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [selectedFunnelId, setSelectedFunnelId] = useState<string>("");
  const [selectedResponsibleId, setSelectedResponsibleId] = useState<string>("");
  const [showFunnelForm, setShowFunnelForm] = useState(false);
  const [showOpportunityForm, setShowOpportunityForm] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<any>(null);
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [showOpportunityDetails, setShowOpportunityDetails] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);

  const funnels = useQuery(api.funnels.list, {});
  const users = useQuery(api.users.list, {});
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const createDefaultFunnel = useMutation(api.funnels.createDefaultFunnel);
  const opportunities = useQuery(
    api.opportunities.listByStage,
    selectedFunnelId ? { 
      funnelId: selectedFunnelId as any,
      createdBy: selectedResponsibleId === 'mine' ? loggedInUser?._id : (selectedResponsibleId ? selectedResponsibleId as any : undefined)
    } : "skip"
  );
  const contacts = useQuery(api.contacts.list, {});
  const companies = useQuery(api.companies.list);
  const createOpportunity = useMutation(api.opportunities.create);
  const updateOpportunity = useMutation(api.opportunities.update);
  const updateStageAndOrder = useMutation(api.opportunities.updateStageAndOrder);
  const removeOpportunity = useMutation(api.opportunities.remove);
  const createFunnel = useMutation(api.funnels.create);
  const migrateToDefaultFunnel = useMutation(api.opportunities.migrateToDefaultFunnel);

  const [opportunityFormData, setOpportunityFormData] = useState({
    title: "",
    description: "",
    value: "",
    stage: "",
    probability: "",
    expectedCloseDate: "",
    contactId: "",
    companyId: "",
  });

  const [funnelFormData, setFunnelFormData] = useState({
    name: "",
    description: "",
    stages: [
      { id: "prospecting", name: "Prospecção", color: "bg-gray-100 text-gray-800", order: 1 },
      { id: "qualification", name: "Qualificação", color: "bg-blue-100 text-blue-800", order: 2 },
      { id: "proposal", name: "Proposta", color: "bg-yellow-100 text-yellow-800", order: 3 },
      { id: "negotiation", name: "Negociação", color: "bg-orange-100 text-orange-800", order: 4 },
      { id: "closed_won", name: "Fechado - Ganho", color: "bg-green-100 text-green-800", order: 5 },
      { id: "closed_lost", name: "Fechado - Perdido", color: "bg-red-100 text-red-800", order: 6 },
    ],
  });

  // Initialize default funnel if none exists and migrate opportunities
  useEffect(() => {
    if (funnels && funnels.length === 0) {
      createDefaultFunnel({});
    } else if (funnels && funnels.length > 0 && !selectedFunnelId) {
      const defaultFunnel = funnels.find(f => f.isDefault) || funnels[0];
      setSelectedFunnelId(defaultFunnel._id);
      
      // Migrate opportunities without funnelId
      migrateToDefaultFunnel({}).then((result) => {
        if (result.migrated > 0) {
          toast.success(`${result.migrated} oportunidades migradas para o funil padrão`);
        }
      }).catch(() => {
        // Ignore migration errors
      });
    }
  }, [funnels, selectedFunnelId, createDefaultFunnel, migrateToDefaultFunnel]);

  const selectedFunnel = funnels?.find(f => f._id === selectedFunnelId);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleOpenOpportunityDetails = (opportunity: any) => {
    setSelectedOpportunity(opportunity);
    setShowOpportunityDetails(true);
  };

  const handleDragStart = (e: React.DragEvent, opportunity: any) => {
    setDraggedItem(opportunity);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.stage === targetStage) {
      setDraggedItem(null);
      return;
    }

    try {
      const targetStageOpportunities = opportunities?.[targetStage] || [];
      const newOrder = targetStageOpportunities.length + 1;

      await updateStageAndOrder({
        id: draggedItem._id,
        stage: targetStage,
        order: newOrder,
      });

      toast.success("Oportunidade movida com sucesso!");
    } catch (error) {
      toast.error("Erro ao mover oportunidade");
    }

    setDraggedItem(null);
  };

  const handleOpportunitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFunnelId) {
      toast.error("Selecione um funil");
      return;
    }

    try {
      const submitData = {
        title: opportunityFormData.title,
        description: opportunityFormData.description || undefined,
        value: parseFloat(opportunityFormData.value),
        stage: opportunityFormData.stage,
        funnelId: selectedFunnelId as any,
        probability: parseInt(opportunityFormData.probability),
        expectedCloseDate: new Date(opportunityFormData.expectedCloseDate).getTime(),
        contactId: opportunityFormData.contactId ? opportunityFormData.contactId as any : undefined,
        companyId: opportunityFormData.companyId ? opportunityFormData.companyId as any : undefined,
      };

      if (editingOpportunity) {
        await updateOpportunity({
          id: editingOpportunity._id,
          ...submitData,
        });
        toast.success("Oportunidade atualizada com sucesso!");
      } else {
        await createOpportunity(submitData);
        toast.success("Oportunidade criada com sucesso!");
      }
      
      resetOpportunityForm();
    } catch (error) {
      toast.error("Erro ao salvar oportunidade");
    }
  };

  const resetOpportunityForm = () => {
    setOpportunityFormData({
      title: "",
      description: "",
      value: "",
      stage: selectedFunnel?.stages[0]?.id || "",
      probability: "",
      expectedCloseDate: "",
      contactId: "",
      companyId: "",
    });
    setEditingOpportunity(null);
    setShowOpportunityForm(false);
  };

  const handleEditOpportunity = (opportunity: any) => {
    setOpportunityFormData({
      title: opportunity.title || "",
      description: opportunity.description || "",
      value: opportunity.value?.toString() || "",
      stage: opportunity.stage || "",
      probability: opportunity.probability?.toString() || "",
      expectedCloseDate: opportunity.expectedCloseDate 
        ? new Date(opportunity.expectedCloseDate).toISOString().split('T')[0]
        : "",
      contactId: opportunity.contactId || "",
      companyId: opportunity.companyId || "",
    });
    setEditingOpportunity(opportunity);
    setShowOpportunityForm(true);
  };

  const handleDeleteOpportunity = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta oportunidade?")) {
      try {
        await removeOpportunity({ id: id as any });
        toast.success("Oportunidade excluída com sucesso!");
      } catch (error) {
        toast.error("Erro ao excluir oportunidade");
      }
    }
  };

  if (!funnels || !contacts || !companies) {
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
    <div className="p-4 h-full flex flex-col">


      {/* Filters */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <select
            value={selectedFunnelId}
            onChange={(e) => setSelectedFunnelId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {funnels.map((funnel) => (
              <option key={funnel._id} value={funnel._id}>
                {funnel.name} {funnel.isDefault ? "(Padrão)" : ""}
              </option>
            ))}
          </select>
          
          <select
            value={selectedResponsibleId}
            onChange={(e) => setSelectedResponsibleId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todas negociações</option>
            <option value="mine">Minhas negociações</option>
          </select>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-2 text-sm flex items-center space-x-1 ${
                viewMode === "kanban"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span>📋</span>
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-2 text-sm border-l border-gray-300 flex items-center space-x-1 ${
                viewMode === "table"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span>📊</span>
              <span>Tabela</span>
            </button>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setShowFunnelForm(true)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm"
            >
              Novo Funil
            </button>
            <button
              onClick={() => {
                setOpportunityFormData({
                  ...opportunityFormData,
                  stage: selectedFunnel?.stages[0]?.id || "",
                });
                setShowOpportunityForm(true);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
            >
              Nova Oportunidade
            </button>
          </div>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === "kanban" && selectedFunnel && opportunities && (
        <div className="flex gap-6 flex-1 min-h-0 pb-4 overflow-x-auto">
          {selectedFunnel.stages.map((stage) => {
            const stageOpportunities = opportunities[stage.id] || [];
            const stageValue = stageOpportunities.reduce((sum, opp) => sum + opp.value, 0);
            
            return (
              <div
                key={stage.id}
                className="flex-1 bg-gray-50 rounded-lg p-4 flex flex-col min-w-[280px] border border-gray-200"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                    <p className="text-sm text-gray-600">
                      {stageOpportunities.length} oportunidades • {formatCurrency(stageValue)}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${stage.color}`}>
                    {stageOpportunities.length}
                  </span>
                </div>
                
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {stageOpportunities.map((opportunity) => (
                    <div
                      key={opportunity._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, opportunity)}
                      onClick={() => handleOpenOpportunityDetails(opportunity)}
                      className="bg-white p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900 text-sm">{opportunity.title}</h4>
                        <div className="flex space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditOpportunity(opportunity);
                            }}
                            className="text-blue-500 hover:text-blue-700 text-sm"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteOpportunity(opportunity._id);
                            }}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-lg font-bold text-green-600 mb-2">
                        {formatCurrency(opportunity.value)}
                      </p>
                      
                      {opportunity.contactName && (
                        <p className="text-sm text-gray-600 mb-1">
                          👤 {opportunity.contactName}
                        </p>
                      )}
                      {opportunity.companyName && (
                        <p className="text-sm text-gray-600 mb-1">
                          🏢 {opportunity.companyName}
                        </p>
                      )}
                      {opportunity.createdByName && (
                        <p className="text-sm text-gray-600 mb-2">
                          Responsável: {opportunity.createdByName}
                        </p>
                      )}
                      
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>Prob: {opportunity.probability}%</span>
                        <span>📅 {new Date(opportunity.expectedCloseDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  ))}
                  
                  {stageOpportunities.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <p className="text-sm">Nenhuma oportunidade</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && selectedFunnel && opportunities && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Oportunidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Responsável
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estágio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Probabilidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Prevista
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.values(opportunities).flat().map((opportunity) => {
                  const stageInfo = selectedFunnel.stages.find(s => s.id === opportunity.stage);
                  return (
                    <tr key={opportunity._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{opportunity.title}</div>
                          {opportunity.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {opportunity.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {opportunity.contactName || opportunity.companyName || "-"}
                        </div>
                        {opportunity.contactName && opportunity.companyName && (
                          <div className="text-sm text-gray-500">{opportunity.companyName}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {opportunity.createdByName || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(opportunity.value)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stageInfo?.color || 'bg-gray-100 text-gray-800'}`}>
                          {stageInfo?.name || opportunity.stage}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {opportunity.probability}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(opportunity.expectedCloseDate).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditOpportunity(opportunity)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteOpportunity(opportunity._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Opportunity Form Modal */}
      {showOpportunityForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingOpportunity ? "Editar Oportunidade" : "Nova Oportunidade"}
            </h2>
            
            <form onSubmit={handleOpportunitySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  required
                  value={opportunityFormData.title}
                  onChange={(e) => setOpportunityFormData({ ...opportunityFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={opportunityFormData.description}
                  onChange={(e) => setOpportunityFormData({ ...opportunityFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={opportunityFormData.value}
                    onChange={(e) => setOpportunityFormData({ ...opportunityFormData, value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Probabilidade (%) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={opportunityFormData.probability}
                    onChange={(e) => setOpportunityFormData({ ...opportunityFormData, probability: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estágio *
                  </label>
                  <select
                    value={opportunityFormData.stage}
                    onChange={(e) => setOpportunityFormData({ ...opportunityFormData, stage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {selectedFunnel?.stages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Prevista de Fechamento *
                  </label>
                  <input
                    type="date"
                    required
                    value={opportunityFormData.expectedCloseDate}
                    onChange={(e) => setOpportunityFormData({ ...opportunityFormData, expectedCloseDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contato
                  </label>
                  <select
                    value={opportunityFormData.contactId}
                    onChange={(e) => setOpportunityFormData({ ...opportunityFormData, contactId: e.target.value })}
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
                    value={opportunityFormData.companyId}
                    onChange={(e) => setOpportunityFormData({ ...opportunityFormData, companyId: e.target.value })}
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
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetOpportunityForm}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingOpportunity ? "Atualizar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Funnel Form Modal */}
      {showFunnelForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Novo Funil de Vendas</h2>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await createFunnel(funnelFormData);
                toast.success("Funil criado com sucesso!");
                setShowFunnelForm(false);
              } catch (error) {
                toast.error("Erro ao criar funil");
              }
            }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Funil *
                  </label>
                  <input
                    type="text"
                    required
                    value={funnelFormData.name}
                    onChange={(e) => setFunnelFormData({ ...funnelFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <input
                    type="text"
                    value={funnelFormData.description}
                    onChange={(e) => setFunnelFormData({ ...funnelFormData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Estágios do Funil
                </label>
                <div className="space-y-3">
                  {funnelFormData.stages.map((stage, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <input
                        type="text"
                        value={stage.name}
                        onChange={(e) => {
                          const newStages = [...funnelFormData.stages];
                          newStages[index].name = e.target.value;
                          setFunnelFormData({ ...funnelFormData, stages: newStages });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nome do estágio"
                      />
                      <select
                        value={stage.color}
                        onChange={(e) => {
                          const newStages = [...funnelFormData.stages];
                          newStages[index].color = e.target.value;
                          setFunnelFormData({ ...funnelFormData, stages: newStages });
                        }}
                        className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="bg-gray-100 text-gray-800">Cinza</option>
                        <option value="bg-blue-100 text-blue-800">Azul</option>
                        <option value="bg-yellow-100 text-yellow-800">Amarelo</option>
                        <option value="bg-orange-100 text-orange-800">Laranja</option>
                        <option value="bg-green-100 text-green-800">Verde</option>
                        <option value="bg-red-100 text-red-800">Vermelho</option>
                        <option value="bg-purple-100 text-purple-800">Roxo</option>
                      </select>
                      {funnelFormData.stages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newStages = funnelFormData.stages.filter((_, i) => i !== index);
                            setFunnelFormData({ ...funnelFormData, stages: newStages });
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    const newStage = {
                      id: `stage_${Date.now()}`,
                      name: "",
                      color: "bg-gray-100 text-gray-800",
                      order: funnelFormData.stages.length + 1,
                    };
                    setFunnelFormData({
                      ...funnelFormData,
                      stages: [...funnelFormData.stages, newStage],
                    });
                  }}
                  className="mt-3 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
                >
                  + Adicionar Estágio
                </button>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowFunnelForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Criar Funil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalhes da Oportunidade */}
      {showOpportunityDetails && selectedOpportunity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Detalhes da Oportunidade</h2>
              <button
                onClick={() => setShowOpportunityDetails(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded">{selectedOpportunity.title}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded">{formatCurrency(selectedOpportunity.value)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contato</label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded">{selectedOpportunity.contactName}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded">{selectedOpportunity.contactEmail}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded">{selectedOpportunity.contactPhone || 'Não informado'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Probabilidade</label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded">{selectedOpportunity.probability}%</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Prevista de Fechamento</label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded">
                  {selectedOpportunity.expectedCloseDate ? 
                    new Date(selectedOpportunity.expectedCloseDate).toLocaleDateString('pt-BR') : 
                    'Não definida'
                  }
                </p>
              </div>
              
              {selectedOpportunity.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <p className="text-gray-900 bg-gray-50 p-2 rounded whitespace-pre-wrap">{selectedOpportunity.description}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estágio</label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded">{selectedOpportunity.stage}</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowOpportunityDetails(false);
                  handleEditOpportunity(selectedOpportunity);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Editar
              </button>
              <button
                onClick={() => setShowOpportunityDetails(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
   );
 };
