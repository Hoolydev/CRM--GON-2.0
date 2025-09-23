import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: { funnelId: v.optional(v.id("funnels")), createdBy: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let opportunities;
    
    if (args.funnelId !== undefined) {
      const funnelId = args.funnelId;
      let query = ctx.db
        .query("opportunities")
        .withIndex("by_funnel", (q) => q.eq("funnelId", funnelId))
        .order("desc");
      
      if (args.createdBy) {
        query = query.filter((q) => q.eq(q.field("createdBy"), args.createdBy));
      }
      
      opportunities = await query.collect();
    } else {
      let query = ctx.db
        .query("opportunities")
        .order("desc");
      
      if (args.createdBy) {
        query = query.filter((q) => q.eq(q.field("createdBy"), args.createdBy));
      }
      
      opportunities = await query.collect();
    }

    // Get related data for each opportunity
    const opportunitiesWithData = await Promise.all(
      opportunities.map(async (opportunity) => {
        let contactName = null;
        let companyName = null;
        let createdByName = null;

        if (opportunity.contactId) {
          const contact = await ctx.db.get(opportunity.contactId);
          if (contact) {
            contactName = `${contact.firstName} ${contact.lastName}`;
          }
        }

        if (opportunity.companyId) {
          const company = await ctx.db.get(opportunity.companyId);
          if (company) {
            companyName = company.name;
          }
        }

        if (opportunity.createdBy) {
          const user = await ctx.db.get(opportunity.createdBy);
          if (user) {
            createdByName = user.name || user.email || 'Usuário';
          }
        }

        return { ...opportunity, contactName, companyName, createdByName };
      })
    );

    return opportunitiesWithData;
  },
});

export const listByStage = query({
  args: { funnelId: v.optional(v.id("funnels")), createdBy: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let opportunities;
    
    if (args.funnelId !== undefined) {
      const funnelId = args.funnelId;
      let query = ctx.db
        .query("opportunities")
        .withIndex("by_funnel", (q) => q.eq("funnelId", funnelId));
      
      if (args.createdBy !== undefined && args.createdBy !== null) {
        query = query.filter((q) => q.eq(q.field("createdBy"), args.createdBy));
      }
      
      opportunities = await query.collect();
    } else {
      let query = ctx.db
        .query("opportunities");
      
      if (args.createdBy !== undefined && args.createdBy !== null) {
        query = query.filter((q) => q.eq(q.field("createdBy"), args.createdBy));
      }
      
      opportunities = await query.collect();
    }

    // Get related data for each opportunity
    const opportunitiesWithData = await Promise.all(
      opportunities.map(async (opportunity) => {
        let contactName = null;
        let companyName = null;
        let createdByName = null;

        if (opportunity.contactId) {
          const contact = await ctx.db.get(opportunity.contactId);
          if (contact) {
            contactName = `${contact.firstName} ${contact.lastName}`;
          }
        }

        if (opportunity.companyId) {
          const company = await ctx.db.get(opportunity.companyId);
          if (company) {
            companyName = company.name;
          }
        }

        if (opportunity.createdBy) {
          const user = await ctx.db.get(opportunity.createdBy);
          if (user) {
            createdByName = user.name || user.email || 'Usuário';
          }
        }

        return { ...opportunity, contactName, companyName, createdByName };
      })
    );

    // Group by stage
    const groupedByStage: Record<string, typeof opportunitiesWithData> = {};
    
    opportunitiesWithData.forEach(opp => {
      if (!groupedByStage[opp.stage]) {
        groupedByStage[opp.stage] = [];
      }
      groupedByStage[opp.stage].push(opp);
    });

    // Sort within each stage by order, then by creation time
    Object.keys(groupedByStage).forEach(stage => {
      groupedByStage[stage].sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        return b._creationTime - a._creationTime;
      });
    });

    return groupedByStage;
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    value: v.number(),
    stage: v.string(),
    funnelId: v.optional(v.id("funnels")),
    probability: v.number(),
    expectedCloseDate: v.number(),
    contactId: v.optional(v.id("contacts")),
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get the highest order in the stage
    const stageOpportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_stage", (q) => q.eq("stage", args.stage))
      .collect();

    const maxOrder = Math.max(0, ...stageOpportunities.map(opp => opp.order || 0));

    return await ctx.db.insert("opportunities", {
      ...args,
      assignedTo: userId,
      createdBy: userId,
      order: maxOrder + 1,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("opportunities"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    value: v.optional(v.number()),
    stage: v.optional(v.string()),
    funnelId: v.optional(v.id("funnels")),
    probability: v.optional(v.number()),
    expectedCloseDate: v.optional(v.number()),
    contactId: v.optional(v.id("contacts")),
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    const opportunity = await ctx.db.get(id);
    
    if (!opportunity || opportunity.createdBy !== userId) {
      throw new Error("Opportunity not found");
    }

    await ctx.db.patch(id, updates);
  },
});

export const updateStageAndOrder = mutation({
  args: {
    id: v.id("opportunities"),
    stage: v.string(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const opportunity = await ctx.db.get(args.id);
    if (!opportunity || opportunity.createdBy !== userId) {
      throw new Error("Opportunity not found");
    }

    await ctx.db.patch(args.id, {
      stage: args.stage,
      order: args.order,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("opportunities") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const opportunity = await ctx.db.get(args.id);
    if (!opportunity || opportunity.createdBy !== userId) {
      throw new Error("Opportunity not found");
    }

    await ctx.db.delete(args.id);
  },
});

export const migrateToDefaultFunnel = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const defaultFunnel = await ctx.db
      .query("funnels")
      .withIndex("by_created_by", (q) => q.eq("createdBy", userId))
      .filter((q) => q.eq(q.field("isDefault"), true))
      .first();

    if (!defaultFunnel) return { migrated: 0 };

    const opportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_created_by", (q) => q.eq("createdBy", userId))
      .collect();

    let migrated = 0;
    for (const opportunity of opportunities) {
      if (!opportunity.funnelId) {
        await ctx.db.patch(opportunity._id, {
          funnelId: defaultFunnel._id,
        });
        migrated++;
      }
    }

    return { migrated };
  },
});
