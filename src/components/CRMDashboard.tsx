import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { CompaniesView } from "./CompaniesView";
import { ContactsView } from "./ContactsView";
import { OpportunitiesView } from "./OpportunitiesView";
import { ActivitiesView } from "./ActivitiesView";
import { AdminView } from "./AdminView";

interface CRMDashboardProps {
  currentView: string;
  hideValues?: boolean;
}

export function CRMDashboard({ currentView, hideValues = false }: CRMDashboardProps) {
  if (currentView === "companies") {
    return <CompaniesView />;
  }
  
  if (currentView === "contacts") {
    return <ContactsView />;
  }
  
  if (currentView === "opportunities") {
    return <OpportunitiesView hideValues={hideValues} />;
  }
  
  if (currentView === "activities") {
    return <ActivitiesView />;
  }
  
  if (currentView === "admin") {
    return <AdminView />;
  }

  return <DashboardOverview hideValues={hideValues} />;
}

function DashboardOverview({ hideValues = false }: { hideValues?: boolean }) {
  const stats = useQuery(api.dashboard.getStats);
  const recentActivity = useQuery(api.dashboard.getRecentActivity);

  if (!stats || !recentActivity) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow h-24"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const maskCurrency = (value: number) => hideValues ? "R$ •••••" : formatCurrency(value);

  return (
    <div className="p-8">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-lg text-gray-500">Visão geral do seu CRM</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Empresas</p>
                <p className="text-3xl font-bold text-gray-900">{stats.counts.companies}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Contatos</p>
                <p className="text-3xl font-bold text-gray-900">{stats.counts.contacts}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Oportunidades</p>
                <p className="text-3xl font-bold text-gray-900">{stats.counts.opportunities}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Atividades</p>
                <p className="text-3xl font-bold text-gray-900">{stats.counts.activities}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Pipeline Overview */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Pipeline de Vendas</h2>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <span className="text-sm font-medium text-gray-600">Valor Total</span>
                <span className="font-bold text-xl text-gray-900">{maskCurrency(stats.opportunities.totalValue)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
                <span className="text-sm font-medium text-gray-600">Vendas Fechadas</span>
                <span className="font-bold text-xl text-green-600">{maskCurrency(stats.opportunities.wonValue)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
                <span className="text-sm font-medium text-gray-600">Taxa de Conversão</span>
                <span className="font-bold text-xl text-blue-600">{stats.opportunities.conversionRate.toFixed(1)}%</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Por Estágio</h3>
              <div className="space-y-3">
                {Object.entries(stats.pipelineByStage).map(([stage, data]) => (
                  <div key={stage} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <span className="text-sm font-medium capitalize text-gray-700">{stage.replace('_', ' ')}</span>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">{data.count} oportunidades</div>
                      <div className="text-xs text-gray-500">{maskCurrency(data.value)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Atividades Recentes</h2>
          </div>
          
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500">Nenhuma atividade recente</p>
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity._id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {activity.type === "call" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />}
                      {activity.type === "email" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />}
                      {activity.type === "meeting" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
                      {activity.type === "task" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
                      {activity.type === "note" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />}
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 mb-1">{activity.title}</p>
                    <p className="text-xs text-gray-500 mb-2">
                      {activity.contactName && `${activity.contactName} • `}
                      {activity.companyName && `${activity.companyName} • `}
                      {new Date(activity._creationTime).toLocaleDateString('pt-BR')}
                    </p>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        activity.status === "completed" 
                          ? "bg-green-100 text-green-800"
                          : activity.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {activity.status === "completed" && "Concluída"}
                        {activity.status === "pending" && "Pendente"}
                        {activity.status === "cancelled" && "Cancelada"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Resumo de Atividades</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-blue-50 rounded-xl">
            <div className="text-4xl font-bold text-blue-600 mb-2">{stats.activities.total}</div>
            <div className="text-sm font-medium text-gray-600">Total de Atividades</div>
          </div>
          <div className="text-center p-6 bg-yellow-50 rounded-xl">
            <div className="text-4xl font-bold text-yellow-600 mb-2">{stats.activities.pending}</div>
            <div className="text-sm font-medium text-gray-600">Atividades Pendentes</div>
          </div>
          <div className="text-center p-6 bg-red-50 rounded-xl">
            <div className="text-4xl font-bold text-red-600 mb-2">{stats.activities.overdue}</div>
            <div className="text-sm font-medium text-gray-600">Atividades Atrasadas</div>
          </div>
        </div>
      </div>
    </div>
  );
}
