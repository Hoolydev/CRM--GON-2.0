import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    contactId: v.optional(v.id("contacts")),
    companyId: v.optional(v.id("companies")),
    opportunityId: v.optional(v.id("opportunities")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let query = ctx.db.query("notes").withIndex("by_created_by", (q) => q.eq("createdBy", userId));

    if (args.contactId) {
      query = ctx.db.query("notes").withIndex("by_contact", (q) => q.eq("contactId", args.contactId));
    } else if (args.companyId) {
      query = ctx.db.query("notes").withIndex("by_company", (q) => q.eq("companyId", args.companyId));
    } else if (args.opportunityId) {
      query = ctx.db.query("notes").withIndex("by_opportunity", (q) => q.eq("opportunityId", args.opportunityId));
    }

    return await query.order("desc").collect();
  },
});

export const create = mutation({
  args: {
    content: v.string(),
    contactId: v.optional(v.id("contacts")),
    companyId: v.optional(v.id("companies")),
    opportunityId: v.optional(v.id("opportunities")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("notes", {
      ...args,
      createdBy: userId,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const note = await ctx.db.get(args.id);
    if (!note || note.createdBy !== userId) {
      throw new Error("Note not found");
    }

    await ctx.db.delete(args.id);
  },
});
