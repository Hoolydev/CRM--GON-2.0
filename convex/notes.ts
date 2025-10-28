import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    contactId: v.optional(v.id("contacts")),
    companyId: v.optional(v.id("companies")),
    opportunityId: v.optional(v.id("opportunities")),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let q = ctx.db.query("notes").withIndex("by_created_by", (qi: any) => qi.eq("createdBy", userId));
    if (args.contactId) q = ctx.db.query("notes").withIndex("by_contact", (qi: any) => qi.eq("contactId", args.contactId));
    else if (args.companyId) q = ctx.db.query("notes").withIndex("by_company", (qi: any) => qi.eq("companyId", args.companyId));
    else if (args.opportunityId) q = ctx.db.query("notes").withIndex("by_opportunity", (qi: any) => qi.eq("opportunityId", args.opportunityId));
    return await q.order("desc").collect();
  },
});

export const create = mutation({
  args: {
    content: v.string(),
    contactId: v.optional(v.id("contacts")),
    companyId: v.optional(v.id("companies")),
    opportunityId: v.optional(v.id("opportunities")),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("notes", { ...args, createdBy: userId });
  },
});