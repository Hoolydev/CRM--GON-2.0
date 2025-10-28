import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const users = await ctx.db.query("users").collect();
    
    return users.map(user => ({
      _id: user._id,
      name: user.name || user.email || 'Usuário',
      email: user.email
    }));
  },
});