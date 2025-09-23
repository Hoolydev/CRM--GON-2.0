import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: { companyId: v.optional(v.id("companies")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let query = ctx.db.query("contacts").withIndex("by_created_by", (q) => q.eq("createdBy", userId));
    
    if (args.companyId) {
      query = ctx.db.query("contacts").withIndex("by_company", (q) => q.eq("companyId", args.companyId));
    }

    const contacts = await query.order("desc").collect();

    // Get company names for each contact
    const contactsWithCompany = await Promise.all(
      contacts.map(async (contact) => {
        let companyName = null;
        if (contact.companyId) {
          const company = await ctx.db.get(contact.companyId);
          companyName = company?.name || null;
        }
        return { ...contact, companyName };
      })
    );

    return contactsWithCompany;
  },
});

export const get = query({
  args: { id: v.id("contacts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const contact = await ctx.db.get(args.id);
    if (!contact || contact.createdBy !== userId) {
      throw new Error("Contact not found");
    }

    let companyName = null;
    if (contact.companyId) {
      const company = await ctx.db.get(contact.companyId);
      companyName = company?.name || null;
    }

    return { ...contact, companyName };
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
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("contacts", {
      ...args,
      createdBy: userId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("contacts"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    position: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("prospect"))),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    const contact = await ctx.db.get(id);
    
    if (!contact || contact.createdBy !== userId) {
      throw new Error("Contact not found");
    }

    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("contacts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const contact = await ctx.db.get(args.id);
    if (!contact || contact.createdBy !== userId) {
      throw new Error("Contact not found");
    }

    await ctx.db.delete(args.id);
  },
});
