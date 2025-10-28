import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: { companyId: v.optional(v.id("companies")) },
  handler: async (ctx: any, args: any) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let q = ctx.db.query("contacts").withIndex("by_created_by", (qi: any) => qi.eq("createdBy", userId));
    if (args.companyId) {
      q = ctx.db.query("contacts").withIndex("by_company", (qi: any) => qi.eq("companyId", args.companyId));
    }
    return await q.order("desc").collect();
  },
});

export const create = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    position: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("prospect")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("contacts", { ...args, createdBy: userId });
  },
});