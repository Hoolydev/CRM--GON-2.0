import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("companies")
      .withIndex("by_created_by", (q) => q.eq("createdBy", userId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { id: v.id("companies") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const company = await ctx.db.get(args.id);
    if (!company || company.createdBy !== userId) {
      throw new Error("Company not found");
    }

    return company;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    industry: v.optional(v.string()),
    website: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    size: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("companies", {
      ...args,
      createdBy: userId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("companies"),
    name: v.optional(v.string()),
    industry: v.optional(v.string()),
    website: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    size: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    const company = await ctx.db.get(id);
    
    if (!company || company.createdBy !== userId) {
      throw new Error("Company not found");
    }

    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("companies") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const company = await ctx.db.get(args.id);
    if (!company || company.createdBy !== userId) {
      throw new Error("Company not found");
    }

    await ctx.db.delete(args.id);
  },
});
