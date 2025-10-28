import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx: any) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db
      .query("funnels")
      .withIndex("by_created_by", (q: any) => q.eq("createdBy", userId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    stages: v.array(v.object({ id: v.string(), name: v.string(), color: v.string(), order: v.number() })),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    // primeiro funil vira default
    const existing = await ctx.db
      .query("funnels")
      .withIndex("by_created_by", (q: any) => q.eq("createdBy", userId))
      .collect();
    const isDefault = existing.length === 0;
    return await ctx.db.insert("funnels", { ...args, createdBy: userId, isDefault });
  },
});

export const createDefaultFunnel = mutation({
  args: {},
  handler: async (ctx: any) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("funnels")
      .withIndex("by_created_by", (q: any) => q.eq("createdBy", userId))
      .collect();
    if (existing.length > 0) {
      return existing.find((f: any) => f.isDefault) ?? existing[0];
    }

    const stages = [
      { id: "prospecting", name: "Prospecção", color: "bg-gray-100 text-gray-800", order: 1 },
      { id: "qualification", name: "Qualificação", color: "bg-blue-100 text-blue-800", order: 2 },
      { id: "proposal", name: "Proposta", color: "bg-yellow-100 text-yellow-800", order: 3 },
      { id: "negotiation", name: "Negociação", color: "bg-orange-100 text-orange-800", order: 4 },
      { id: "closed_won", name: "Fechado - Ganho", color: "bg-green-100 text-green-800", order: 5 },
      { id: "closed_lost", name: "Fechado - Perdido", color: "bg-red-100 text-red-800", order: 6 },
    ];

    const id = await ctx.db.insert("funnels", {
      name: "Funil Padrão",
      description: "Funil inicial padrão",
      stages,
      createdBy: userId,
      isDefault: true,
    });

    return await ctx.db.get(id);
  },
});