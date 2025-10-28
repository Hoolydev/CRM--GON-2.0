import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    contactId: v.optional(v.id("contacts")),
    companyId: v.optional(v.id("companies")),
    opportunityId: v.optional(v.id("opportunities")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let query = ctx.db.query("activities").withIndex("by_assigned_to", (q) => q.eq("assignedTo", userId));

    if (args.contactId) {
      query = ctx.db.query("activities").withIndex("by_contact", (q) => q.eq("contactId", args.contactId));
    } else if (args.companyId) {
      query = ctx.db.query("activities").withIndex("by_company", (q) => q.eq("companyId", args.companyId));
    } else if (args.opportunityId) {
      query = ctx.db.query("activities").withIndex("by_opportunity", (q) => q.eq("opportunityId", args.opportunityId));
    } else if (args.status) {
      query = ctx.db.query("activities").withIndex("by_status", (q) => q.eq("status", args.status as any));
    }

    const activities = await query.order("desc").collect();

    // Get related entity names
    const activitiesWithDetails = await Promise.all(
      activities.map(async (activity) => {
        let contactName = null;
        let companyName = null;
        let opportunityTitle = null;

        if (activity.contactId) {
          const contact = await ctx.db.get(activity.contactId);
          contactName = contact ? `${contact.firstName} ${contact.lastName}` : null;
        }

        if (activity.companyId) {
          const company = await ctx.db.get(activity.companyId);
          companyName = company?.name || null;
        }

        if (activity.opportunityId) {
          const opportunity = await ctx.db.get(activity.opportunityId);
          opportunityTitle = opportunity?.title || null;
        }

        return { ...activity, contactName, companyName, opportunityTitle };
      })
    );

    return activitiesWithDetails;
  },
});

export const create = mutation({
  args: {
    type: v.union(
      v.literal("call"),
      v.literal("email"),
      v.literal("meeting"),
      v.literal("task"),
      v.literal("note")
    ),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("cancelled")),
    dueDate: v.optional(v.number()),
    contactId: v.optional(v.id("contacts")),
    companyId: v.optional(v.id("companies")),
    opportunityId: v.optional(v.id("opportunities")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("activities", {
      ...args,
      assignedTo: userId,
      createdBy: userId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("activities"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(v.literal("pending"), v.literal("completed"), v.literal("cancelled"))),
    dueDate: v.optional(v.number()),
    completedDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    const activity = await ctx.db.get(id);
    
    if (!activity || activity.assignedTo !== userId) {
      throw new Error("Activity not found");
    }

    await ctx.db.patch(id, updates);
  },
});

export const complete = mutation({
  args: { id: v.id("activities") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const activity = await ctx.db.get(args.id);
    if (!activity || activity.assignedTo !== userId) {
      throw new Error("Activity not found");
    }

    await ctx.db.patch(args.id, {
      status: "completed",
      completedDate: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("activities") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const activity = await ctx.db.get(args.id);
    if (!activity || activity.assignedTo !== userId) {
      throw new Error("Activity not found");
    }

    await ctx.db.delete(args.id);
  },
});

export const getUpcoming = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    const nextWeek = now + 7 * 24 * 60 * 60 * 1000;

    const activities = await ctx.db
      .query("activities")
      .withIndex("by_assigned_to", (q) => q.eq("assignedTo", userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("status"), "pending"),
          q.gte(q.field("dueDate"), now),
          q.lte(q.field("dueDate"), nextWeek)
        )
      )
      .collect();

    return activities.sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));
  },
});
