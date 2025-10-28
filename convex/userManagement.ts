import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listUsers = query({
  args: {},
  handler: async (ctx: any) => {
    const users = await ctx.db.query("users").order("desc").collect();
    return users.map((u: any) => ({
      _id: u._id,
      email: u.email,
      name: u.name ?? u.email,
      role: u.role ?? "user",
      status: u.status ?? "active",
      createdAt: u.createdAt,
      updatedAt: u.updatedAt ?? null,
    }));
  },
});

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx: any, args: any) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", args.email))
      .unique();
    return user ?? null;
  },
});

export const createUser = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("user"))),
  },
  handler: async (ctx: any, args: any) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", args.email))
      .unique();
    if (existing) {
      throw new Error("Usuário já existe");
    }

    const now = Date.now();
    const id = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      role: args.role ?? "user",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

export const setRole = mutation({
  args: { id: v.id("users"), role: v.union(v.literal("admin"), v.literal("user")) },
  handler: async (ctx: any, args: any) => {
    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("Usuário não encontrado");
    await ctx.db.patch(args.id, { role: args.role, updatedAt: Date.now() });
    return true;
  },
});

export const deactivateUser = mutation({
  args: { id: v.id("users") },
  handler: async (ctx: any, args: any) => {
    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("Usuário não encontrado");
    await ctx.db.patch(args.id, { status: "inactive", updatedAt: Date.now() });
    return true;
  },
});

// Compatível com AdminView
export const getAllUsers = query({
  args: {},
  handler: async (ctx: any) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const users = await ctx.db.query("users").collect();
    return users.map((user: any) => ({
      _id: user._id,
      email: user.email,
      name: user.name ?? user.email,
      _creationTime: user._creationTime,
    }));
  },
});

export const deleteUserByEmail = mutation({
  args: { email: v.string() },
  handler: async (ctx: any, args: any) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const users = await ctx.db.query("users").collect();
    const userToDelete = users.find(
      (u: any) => String(u.email ?? "").toLowerCase() === args.email.toLowerCase()
    );

    if (!userToDelete) {
      throw new Error(`Usuário com email ${args.email} não encontrado`);
    }

    const userOpportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_created_by", (q: any) => q.eq("createdBy", userToDelete._id))
      .collect();

    for (const opportunity of userOpportunities) {
      await ctx.db.patch(opportunity._id, {
        createdBy: userId,
      });
    }

    await ctx.db.delete(userToDelete._id);

    return {
      success: true,
      deletedUser: { _id: userToDelete._id, email: userToDelete.email, name: userToDelete.name },
      transferredOpportunities: userOpportunities.length,
      message: `Usuário ${args.email} deletado com sucesso. ${userOpportunities.length} oportunidades foram transferidas.`,
    };
  },
});