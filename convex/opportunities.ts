import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx: any, args: any) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    let q = ctx.db.query("opportunities").withIndex("by_created_by", (qi: any) => qi.eq("createdBy", userId));
    if (args.status) {
      q = ctx.db.query("opportunities").withIndex("by_status", (qi: any) => qi.eq("status", args.status));
    }
    return await q.order("desc").collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    value: v.optional(v.number()),
    stage: v.optional(v.string()),
    funnelId: v.id("funnels"),
    probability: v.optional(v.number()),
    expectedCloseDate: v.optional(v.number()),
    status: v.optional(v.union(v.literal("open"), v.literal("won"), v.literal("lost"))),
    companyId: v.optional(v.id("companies")),
    contactId: v.optional(v.id("contacts")),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // calcular ordem no estágio dentro do funil
    const stage = args.stage ?? "prospecting";
    const existingInStage = await ctx.db
      .query("opportunities")
      .withIndex("by_funnel", (q: any) => q.eq("funnelId", args.funnelId))
      .collect();
    const countInStage = existingInStage.filter((o: any) => o.stage === stage).length;
    const order = countInStage + 1;

    const record = {
      title: args.title,
      description: args.description,
      value: args.value,
      stage,
      status: args.status ?? "open",
      companyId: args.companyId,
      contactId: args.contactId,
      createdBy: userId,
      funnelId: args.funnelId,
      order,
      probability: args.probability,
      expectedCloseDate: args.expectedCloseDate,
    };

    return await ctx.db.insert("opportunities", record);
  },
});

export const listByStage = query({
  args: {
    createdBy: v.optional(v.id("users")),
    funnelId: v.optional(v.id("funnels")),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let items: any[] = [];
    if (args.createdBy) {
      items = await ctx.db
        .query("opportunities")
        .withIndex("by_created_by", (q: any) => q.eq("createdBy", args.createdBy))
        .collect();
    } else if (args.funnelId) {
      items = await ctx.db
        .query("opportunities")
        .withIndex("by_funnel", (q: any) => q.eq("funnelId", args.funnelId))
        .collect();
    } else {
      return {};
    }

    // agrupar por stage e ordenar pela propriedade order
    const grouped: Record<string, any[]> = {};
    for (const opp of items) {
      const key = opp.stage ?? "prospecting";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(opp);
    }
    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    return grouped;
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
    status: v.optional(v.union(v.literal("open"), v.literal("won"), v.literal("lost"))),
    companyId: v.optional(v.id("companies")),
    contactId: v.optional(v.id("contacts")),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const current = await ctx.db.get(args.id);
    if (!current) throw new Error("Opportunity not found");
    if (current.createdBy !== userId) throw new Error("Not authorized");

    const patch: any = {};
    for (const key of [
      "title",
      "description",
      "value",
      "stage",
      "funnelId",
      "probability",
      "expectedCloseDate",
      "status",
      "companyId",
      "contactId",
    ]) {
      if (args[key] !== undefined) patch[key] = args[key];
    }

    // garantir status
    if (patch.status === undefined) {
      patch.status = current.status ?? "open";
    }

    await ctx.db.patch(args.id, patch);
  },
});

export const updateStageAndOrder = mutation({
  args: {
    id: v.id("opportunities"),
    stage: v.string(),
    order: v.number(),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const current = await ctx.db.get(args.id);
    if (!current) throw new Error("Opportunity not found");
    if (current.createdBy !== userId) throw new Error("Not authorized");

    await ctx.db.patch(args.id, {
      stage: args.stage,
      order: args.order,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("opportunities") },
  handler: async (ctx: any, args: any) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const current = await ctx.db.get(args.id);
    if (!current) throw new Error("Opportunity not found");
    if (current.createdBy !== userId) throw new Error("Not authorized");
    await ctx.db.delete(args.id);
  },
});

export const migrateToDefaultFunnel = mutation({
  args: {},
  handler: async (ctx: any) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const defaultFunnel = await ctx.db
      .query("funnels")
      .withIndex("by_created_by", (q: any) => q.eq("createdBy", userId))
      .collect()
      .then((fs: any[]) => fs.find((f: any) => f.isDefault) ?? fs[0]);
    if (!defaultFunnel) {
      return { migrated: 0 };
    }

    const withoutFunnel = await ctx.db
      .query("opportunities")
      .withIndex("by_created_by", (q: any) => q.eq("createdBy", userId))
      .collect()
      .then((ops: any[]) => ops.filter((o: any) => !o.funnelId));

    let migrated = 0;
    for (const opp of withoutFunnel) {
      await ctx.db.patch(opp._id, {
        funnelId: defaultFunnel._id,
        stage: opp.stage ?? defaultFunnel.stages[0]?.id ?? "prospecting",
        order: typeof opp.order === "number" ? opp.order : 0,
      });
      migrated++;
    }

    return { migrated };
  },
});