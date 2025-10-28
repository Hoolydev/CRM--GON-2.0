import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { Toaster } from "sonner";
import { CRMDashboard } from "./components/CRMDashboard";
import { OverdueAlert } from "./components/OverdueAlert";
import { useOverdueActivities } from "./hooks/useOverdueActivities";
import { useState, useEffect } from "react";
import { BrandHeader } from "./components/BrandHeader";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Authenticated>
        <CRMApp />
      </Authenticated>
      <Unauthenticated>
        <LoginPage />
      </Unauthenticated>
      <Toaster />
    </div>
  );
}

function CRMApp() {
  const [currentView, setCurrentView] = useState("dashboard");
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const { overdueActivities, hasShownAlert, setHasShownAlert } = useOverdueActivities();

  const handleOverdueAlertClose = () => {
    setCurrentView("activities");
    setHasShownAlert(true);
  };

  const handleOverdueAlertDismiss = () => {
    setHasShownAlert(true);
  };

  // Toggle de ocultar valores (persistido em localStorage)
  const [hideValues, setHideValues] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("crm_hide_values");
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("crm_hide_values", JSON.stringify(hideValues));
    } catch {}
  }, [hideValues]);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <BrandHeader
        currentView={currentView}
        setCurrentView={setCurrentView}
        hideValues={hideValues}
        setHideValues={(next) => setHideValues(next)}
        loggedInUser={loggedInUser}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <CRMDashboard currentView={currentView} hideValues={hideValues} />
      </div>

      {/* Alerta Global de Tarefas Atrasadas */}
      {!hasShownAlert && overdueActivities.length > 0 && (
        <OverdueAlert 
          onClose={handleOverdueAlertClose} 
          onDismiss={handleOverdueAlertDismiss} 
        />
      )}
    </div>
  );
}

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="w-full max-w-md p-8">
        <SignInForm />
      </div>
    </div>
  );
}
