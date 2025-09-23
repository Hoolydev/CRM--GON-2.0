import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Lista de usuários válidos da empresa Gon Solutions
const VALID_USERS = [
  "diretordearte@gonsolutions.com",    // Gabriel - Diretor de Arte
  "sydney.queiroz@gonsolutions.com",   // Sydney - Corrigido de gonsolutons.com
  "comercial@gonsolutions.com",        // Ana Laura - Comercial
  "oliveira@gonsolutions.com",         // Oliveira
  "juridico@gonsolutions.com",         // Larissa - Jurídico
];

export const isValidUser = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verifica se o email tem o domínio correto
    if (!args.email.endsWith("@gonsolutions.com")) {
      return { isValid: false, reason: "domínio" };
    }

    // Verifica se o email está na lista de usuários válidos
    const isValid = VALID_USERS.includes(args.email.toLowerCase());
    
    return { 
      isValid, 
      reason: isValid ? null : "não autorizado" 
    };
  },
});

export const getValidUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return VALID_USERS;
  },
});

export const addValidUser = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verifica se o email tem o domínio correto
    if (!args.email.endsWith("@gonsolutions.com")) {
      throw new Error("Apenas emails do domínio @gonsolutions.com são permitidos");
    }

    // Verifica se o email já está na lista
    if (VALID_USERS.includes(args.email.toLowerCase())) {
      throw new Error("Usuário já está na lista de usuários válidos");
    }

    // Em uma implementação real, você salvaria isso no banco de dados
    // Por enquanto, vamos apenas retornar sucesso
    return { success: true, message: "Usuário adicionado à lista de usuários válidos" };
  },
});

export const removeValidUser = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const emailIndex = VALID_USERS.indexOf(args.email.toLowerCase());
    if (emailIndex === -1) {
      throw new Error("Usuário não encontrado na lista de usuários válidos");
    }

    // Em uma implementação real, você removeria do banco de dados
    return { success: true, message: "Usuário removido da lista de usuários válidos" };
  },
});
