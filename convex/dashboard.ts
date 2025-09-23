import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get counts
    const [companies, contacts, opportunities, activities] = await Promise.all([
      ctx.db.query("companies").withIndex("by_created_by", (q) => q.eq("createdBy", userId)).collect(),
      ctx.db.query("contacts").withIndex("by_created_by", (q) => q.eq("createdBy", userId)).collect(),
      ctx.db.query("opportunities").withIndex("by_assigned_to", (q) => q.eq("assignedTo", userId)).collect(),
      ctx.db.query("activities").withIndex("by_assigned_to", (q) => q.eq("assignedTo", userId)).collect(),
    ]);

    // Calculate opportunity metrics
    const totalOpportunityValue = opportunities.reduce((sum, opp) => sum + opp.value, 0);
    const wonOpportunities = opportunities.filter(opp => opp.stage === "closed_won");
    const wonValue = wonOpportunities.reduce((sum, opp) => sum + opp.value, 0);

    // Calculate activity metrics
    const pendingActivities = activities.filter(act => act.status === "pending");
    const overdueActivities = pendingActivities.filter(act => 
      act.dueDate && act.dueDate < Date.now()
    );

    // Pipeline by stage
    const pipelineByStage = opportunities.reduce((acc, opp) => {
      if (!acc[opp.stage]) {
        acc[opp.stage] = { count: 0, value: 0 };
      }
      acc[opp.stage].count++;
      acc[opp.stage].value += opp.value;
      return acc;
    }, {} as Record<string, { count: number; value: number }>);

    return {
      counts: {
        companies: companies.length,
        contacts: contacts.length,
        opportunities: opportunities.length,
        activities: activities.length,
      },
      opportunities: {
        total: opportunities.length,
        totalValue: totalOpportunityValue,
        won: wonOpportunities.length,
        wonValue,
        conversionRate: opportunities.length > 0 ? (wonOpportunities.length / opportunities.length) * 100 : 0,
      },
      activities: {
        total: activities.length,
        pending: pendingActivities.length,
        overdue: overdueActivities.length,
      },
      pipelineByStage,
    };
  },
});

export const getRecentActivity = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const activities = await ctx.db
      .query("activities")
      .withIndex("by_assigned_to", (q) => q.eq("assignedTo", userId))
      .order("desc")
      .take(10);

    // Get related entity names
    const activitiesWithDetails = await Promise.all(
      activities.map(async (activity) => {
        let contactName = null;
        let companyName = null;

        if (activity.contactId) {
          const contact = await ctx.db.get(activity.contactId);
          contactName = contact ? `${contact.firstName} ${contact.lastName}` : null;
        }

        if (activity.companyId) {
          const company = await ctx.db.get(activity.companyId);
          companyName = company?.name || null;
        }

        return { ...activity, contactName, companyName };
      })
    );

    return activitiesWithDetails;
  },
});
