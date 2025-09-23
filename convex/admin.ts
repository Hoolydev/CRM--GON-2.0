import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Lista de usuários válidos da empresa Gon Solutions
const VALID_USERS = [
  "admin@gonsolutions.com",
  "gerencia@gonsolutions.com",
  "vendas@gonsolutions.com",
  "suporte@gonsolutions.com",
  "financeiro@gonsolutions.com",
  "marketing@gonsolutions.com",
  "ti@gonsolutions.com",
];

export const getInvalidUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Busca todos os usuários
    const allUsers = await ctx.db.query("users").collect();
    
    // Filtra usuários inválidos
    const invalidUsers = allUsers.filter(user => {
      // Verifica se tem email
      if (!user.email) return true;
      
      // Verifica se tem domínio correto
      if (!user.email.endsWith("@gonsolutions.com")) return true;
      
      // Verifica se está na lista de usuários válidos
      return !VALID_USERS.includes(user.email.toLowerCase());
    });

    return invalidUsers.map(user => ({
      _id: user._id,
      email: user.email,
      name: user.name,
      _creationTime: user._creationTime,
    }));
  },
});

export const cleanupInvalidUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Busca usuários inválidos
    const allUsers = await ctx.db.query("users").collect();
    
    const invalidUsers = allUsers.filter(user => {
      if (!user.email) return true;
      if (!user.email.endsWith("@gonsolutions.com")) return true;
      return !VALID_USERS.includes(user.email.toLowerCase());
    });

    let deletedCount = 0;
    let transferredOpportunities = 0;

    for (const invalidUser of invalidUsers) {
      // Transferir ou excluir oportunidades associadas
      const userOpportunities = await ctx.db
        .query("opportunities")
        .withIndex("by_created_by", (q) => q.eq("createdBy", invalidUser._id))
        .collect();

      // Transferir para o usuário admin (primeiro usuário válido)
      const adminUser = allUsers.find(user => 
        user.email && VALID_USERS.includes(user.email.toLowerCase())
      );

      if (adminUser && userOpportunities.length > 0) {
        for (const opportunity of userOpportunities) {
          await ctx.db.patch(opportunity._id, {
            createdBy: adminUser._id,
            assignedTo: adminUser._id,
          });
        }
        transferredOpportunities += userOpportunities.length;
      }

      // Excluir o usuário inválido
      await ctx.db.delete(invalidUser._id);
      deletedCount++;
    }

    return {
      deletedUsers: deletedCount,
      transferredOpportunities,
      message: `${deletedCount} usuários inválidos foram excluídos e ${transferredOpportunities} oportunidades foram transferidas para o administrador.`
    };
  },
});

export const getSystemStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const totalUsers = await ctx.db.query("users").collect();
    const totalOpportunities = await ctx.db.query("opportunities").collect();
    const totalContacts = await ctx.db.query("contacts").collect();
    const totalCompanies = await ctx.db.query("companies").collect();

    // Contar usuários válidos e inválidos
    const validUsers = totalUsers.filter(user => {
      if (!user.email) return false;
      if (!user.email.endsWith("@gonsolutions.com")) return false;
      return VALID_USERS.includes(user.email.toLowerCase());
    });

    const invalidUsers = totalUsers.filter(user => {
      if (!user.email) return true;
      if (!user.email.endsWith("@gonsolutions.com")) return true;
      return !VALID_USERS.includes(user.email.toLowerCase());
    });

    return {
      totalUsers: totalUsers.length,
      validUsers: validUsers.length,
      invalidUsers: invalidUsers.length,
      totalOpportunities: totalOpportunities.length,
      totalContacts: totalContacts.length,
      totalCompanies: totalCompanies.length,
    };
  },
});
