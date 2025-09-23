import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("funnels")
      .withIndex("by_created_by", (q) => q.eq("createdBy", userId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { id: v.id("funnels") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const funnel = await ctx.db.get(args.id);
    if (!funnel || funnel.createdBy !== userId) {
      throw new Error("Funnel not found");
    }

    return funnel;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    stages: v.array(v.object({
      id: v.string(),
      name: v.string(),
      color: v.string(),
      order: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if this is the first funnel (make it default)
    const existingFunnels = await ctx.db
      .query("funnels")
      .withIndex("by_created_by", (q) => q.eq("createdBy", userId))
      .collect();

    const isDefault = existingFunnels.length === 0;

    return await ctx.db.insert("funnels", {
      ...args,
      isDefault,
      createdBy: userId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("funnels"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    stages: v.optional(v.array(v.object({
      id: v.string(),
      name: v.string(),
      color: v.string(),
      order: v.number(),
    }))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    const funnel = await ctx.db.get(id);
    
    if (!funnel || funnel.createdBy !== userId) {
      throw new Error("Funnel not found");
    }

    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("funnels") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const funnel = await ctx.db.get(args.id);
    if (!funnel || funnel.createdBy !== userId) {
      throw new Error("Funnel not found");
    }

    // Don't allow deleting if there are opportunities using this funnel
    const opportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_funnel", (q) => q.eq("funnelId", args.id))
      .collect();

    if (opportunities.length > 0) {
      throw new Error("Cannot delete funnel with existing opportunities");
    }

    await ctx.db.delete(args.id);
  },
});

export const setDefault = mutation({
  args: { id: v.id("funnels") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const funnel = await ctx.db.get(args.id);
    if (!funnel || funnel.createdBy !== userId) {
      throw new Error("Funnel not found");
    }

    // Remove default from all other funnels
    const allFunnels = await ctx.db
      .query("funnels")
      .withIndex("by_created_by", (q) => q.eq("createdBy", userId))
      .collect();

    for (const f of allFunnels) {
      if (f._id !== args.id && f.isDefault) {
        await ctx.db.patch(f._id, { isDefault: false });
      }
    }

    // Set this funnel as default
    await ctx.db.patch(args.id, { isDefault: true });
  },
});

export const createDefaultFunnel = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user already has funnels
    const existingFunnels = await ctx.db
      .query("funnels")
      .withIndex("by_created_by", (q) => q.eq("createdBy", userId))
      .collect();

    if (existingFunnels.length > 0) {
      return existingFunnels.find(f => f.isDefault) || existingFunnels[0];
    }

    // Create default funnel with RD Station-like stages
    const defaultStages = [
      { id: "prospecting", name: "Prospecção", color: "bg-gray-100 text-gray-800", order: 1 },
      { id: "qualification", name: "Qualificação", color: "bg-blue-100 text-blue-800", order: 2 },
      { id: "proposal", name: "Proposta", color: "bg-yellow-100 text-yellow-800", order: 3 },
      { id: "negotiation", name: "Negociação", color: "bg-orange-100 text-orange-800", order: 4 },
      { id: "closed_won", name: "Fechado - Ganho", color: "bg-green-100 text-green-800", order: 5 },
      { id: "closed_lost", name: "Fechado - Perdido", color: "bg-red-100 text-red-800", order: 6 },
    ];

    const funnelId = await ctx.db.insert("funnels", {
      name: "Funil Principal",
      description: "Funil padrão de vendas",
      isDefault: true,
      stages: defaultStages,
      createdBy: userId,
    });

    return await ctx.db.get(funnelId);
  },
});
