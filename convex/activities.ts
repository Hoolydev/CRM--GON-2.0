import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: { overdueOnly: v.optional(v.boolean()) },
  handler: async (ctx: any, args: any) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    let q = ctx.db.query("activities").withIndex("by_created_by", (qi: any) => qi.eq("createdBy", userId));
    if (args.overdueOnly) {
      const now = Date.now();
      q = ctx.db.query("activities").withIndex("by_due_date", (qi: any) => qi.lt("dueDate", now));
    }
    return await q.order("desc").collect();
  },
});

export const create = mutation({
  args: {
    type: v.union(v.literal("call"), v.literal("email"), v.literal("meeting"), v.literal("task")),
    title: v.string(),
    notes: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    companyId: v.optional(v.id("companies")),
    contactId: v.optional(v.id("contacts")),
    opportunityId: v.optional(v.id("opportunities")),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("activities", { ...args, completed: false, createdBy: userId });
  },
});