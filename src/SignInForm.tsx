"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState, FormEvent } from "react";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Query para validar usuário (apenas para signUp)
  const [emailToValidate, setEmailToValidate] = useState<string>("");
  const userValidation = useQuery(
    api.validUsers.isValidUser,
    emailToValidate && flow === "signUp" ? { email: emailToValidate } : "skip"
  );

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-10">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Gon CRM</h1>
        <p className="text-gray-500 text-lg">Sistema de Gestão de Relacionamento com Cliente</p>
      </div>
      
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <form
          className="space-y-6"
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitting(true);
            setError(null);
            const formData = new FormData(e.target as HTMLFormElement);
            const email = formData.get("email") as string;
            
            // Validação de domínio para cadastro
            if (flow === "signUp" && !email.endsWith("@gonsolutions.com")) {
              setError("Apenas emails do domínio @gonsolutions.com são permitidos para cadastro.");
              setSubmitting(false);
              return;
            }
            
            // Validação de usuário válido para cadastro
            if (flow === "signUp") {
              setEmailToValidate(email);
              
              // Lista de usuários válidos da empresa
              const validUsers = [
                "admin@gonsolutions.com",
                "gerencia@gonsolutions.com",
                "vendas@gonsolutions.com",
                "suporte@gonsolutions.com",
                "financeiro@gonsolutions.com",
                "marketing@gonsolutions.com",
                "ti@gonsolutions.com",
              ];
              
              if (!validUsers.includes(email.toLowerCase())) {
                setError("Não foi possível criar a conta. O e-mail informado não é válido ou não pertence a um usuário ativo.");
                setSubmitting(false);
                return;
              }
            }
            
            formData.set("flow", flow);
            try {
              await signIn("password", formData);
            } catch (error: any) {
              console.error(error);
              const errorMessage = error instanceof ConvexError
                ? error.data
                : "Ocorreu um erro inesperado";
              setError(errorMessage);
              setSubmitting(false);
            }
          }}
        >
          <div className="space-y-4">
            <div>
              <input
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                type="email"
                name="email"
                placeholder="Digite seu email"
                required
              />
            </div>
            
            <div>
              <input
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                type="password"
                name="password"
                placeholder="Digite sua senha"
                required
              />
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}
          
          <button 
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl" 
            type="submit" 
            disabled={submitting}
          >
            {submitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {flow === "signIn" ? "Entrando..." : "Criando conta..."}
              </div>
            ) : (
              flow === "signIn" ? "Entrar" : "Criar Conta"
            )}
          </button>
          
          <div className="text-center pt-4">
            <span className="text-gray-500 text-sm">
              {flow === "signIn"
                ? "Não tem uma conta? "
                : "Já tem uma conta? "}
            </span>
            <button
              type="button"
              className="text-blue-600 hover:text-blue-700 font-semibold text-sm hover:underline transition-colors"
              onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
            >
              {flow === "signIn" ? "Criar conta" : "Entrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
