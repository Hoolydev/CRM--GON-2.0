import { SignOutButton } from "../SignOutButton";

interface BrandHeaderProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  hideValues: boolean;
  setHideValues: (next: boolean) => void;
  loggedInUser: any;
}

export function BrandHeader({
  currentView,
  setCurrentView,
  hideValues,
  setHideValues,
  loggedInUser,
}: BrandHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Logo e Informações do Usuário */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Cyberg CRM</h1>
                <p className="text-sm text-gray-500">{loggedInUser?.email}</p>
              </div>
            </div>
          </div>

          {/* Navegação Central */}
          <nav className="flex-1 flex justify-center">
            <div className="flex bg-gray-100 rounded-2xl p-1.5 space-x-1">
              <HeaderButton
                active={currentView === "dashboard"}
                onClick={() => setCurrentView("dashboard")}
                label="Dashboard"
                icon={(
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2z" />
                  </svg>
                )}
              />
              <HeaderButton
                active={currentView === "companies"}
                onClick={() => setCurrentView("companies")}
                label="Empresas"
                icon={(
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                )}
              />
              <HeaderButton
                active={currentView === "contacts"}
                onClick={() => setCurrentView("contacts")}
                label="Contatos"
                icon={(
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                )}
              />
              <HeaderButton
                active={currentView === "opportunities"}
                onClick={() => setCurrentView("opportunities")}
                label="Oportunidades"
                icon={(
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                )}
              />
              <HeaderButton
                active={currentView === "activities"}
                onClick={() => setCurrentView("activities")}
                label="Atividades"
                icon={(
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              />
              <HeaderButton
                active={currentView === "admin"}
                onClick={() => setCurrentView("admin")}
                label="Admin"
                icon={(
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              />
            </div>
          </nav>

          {/* Ações à direita: toggle esconder valores + logout */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setHideValues(!hideValues)}
              className="px-3 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center space-x-2"
              title={hideValues ? "Mostrar valores" : "Ocultar valores"}
            >
              {hideValues ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-5-10-7 0-1.015 1.71-3.278 4.5-4.95m3.685-1.435A9.956 9.956 0 0112 5c5.523 0 10 5 10 7 0 .743-.417 1.838-1.23 2.997M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1.5 12s4.5-7.5 10.5-7.5S22.5 12 22.5 12 18 19.5 12 19.5 1.5 12 1.5 12z" />
                  <circle cx="12" cy="12" r="3" strokeWidth={2} />
                </svg>
              )}
              <span>{hideValues ? "Valores ocultos" : "Mostrar valores"}</span>
            </button>
            <SignOutButton />
          </div>
        </div>
      </div>
    </div>
  );
}

function HeaderButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
        active ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
      }`}
    >
      <span className="flex items-center space-x-2">
        {icon}
        <span>{label}</span>
      </span>
    </button>
  );
}