import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const findUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const users = await ctx.db.query("users").collect();
    const user = users.find(u => u.email?.toLowerCase() === args.email.toLowerCase());
    
    return user || null;
  },
});

export const deleteUserByEmail = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const users = await ctx.db.query("users").collect();
    const userToDelete = users.find(u => u.email?.toLowerCase() === args.email.toLowerCase());
    
    if (!userToDelete) {
      throw new Error(`Usuário com email ${args.email} não encontrado`);
    }

    // Transferir oportunidades para o usuário atual (admin)
    const userOpportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_created_by", (q) => q.eq("createdBy", userToDelete._id))
      .collect();

    for (const opportunity of userOpportunities) {
      await ctx.db.patch(opportunity._id, {
        createdBy: userId,
        assignedTo: userId,
      });
    }

    // Deletar o usuário
    await ctx.db.delete(userToDelete._id);

    return {
      success: true,
      deletedUser: userToDelete,
      transferredOpportunities: userOpportunities.length,
      message: `Usuário ${args.email} deletado com sucesso. ${userOpportunities.length} oportunidades foram transferidas.`
    };
  },
});

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const users = await ctx.db.query("users").collect();
    
    return users.map(user => ({
      _id: user._id,
      email: user.email,
      name: user.name,
      _creationTime: user._creationTime,
    }));
  },
});
