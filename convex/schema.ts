import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  companies: defineTable({
    name: v.string(),
    industry: v.optional(v.string()),
    website: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    size: v.optional(v.string()),
    notes: v.optional(v.string()),
    // Legacy fields kept optional to satisfy existing data
    cnpj: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    settings: v.optional(v.object({
      autoDispatch: v.optional(v.boolean()),
      requirePhotos: v.optional(v.number()),
      requireVideos: v.optional(v.number()),
      slaHours: v.optional(v.number()),
    })),
    // Temporarily optional to unblock dev server due to legacy data
    createdBy: v.optional(v.id("users")),
  }).index("by_created_by", ["createdBy"]),

  contacts: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    position: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("prospect")),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
  })
    .index("by_created_by", ["createdBy"])
    .index("by_company", ["companyId"])
    .index("by_email", ["email"]),

  funnels: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    isDefault: v.boolean(),
    stages: v.array(v.object({
      id: v.string(),
      name: v.string(),
      color: v.string(),
      order: v.number(),
    })),
    createdBy: v.id("users"),
  }).index("by_created_by", ["createdBy"]),

  opportunities: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    value: v.number(),
    stage: v.string(),
    funnelId: v.optional(v.id("funnels")),
    probability: v.number(),
    expectedCloseDate: v.number(),
    contactId: v.optional(v.id("contacts")),
    companyId: v.optional(v.id("companies")),
    assignedTo: v.id("users"),
    createdBy: v.id("users"),
    order: v.optional(v.number()),
  })
    .index("by_assigned_to", ["assignedTo"])
    .index("by_created_by", ["createdBy"])
    .index("by_stage", ["stage"])
    .index("by_funnel", ["funnelId"])
    .index("by_contact", ["contactId"])
    .index("by_company", ["companyId"]),

  activities: defineTable({
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
    completedDate: v.optional(v.number()),
    contactId: v.optional(v.id("contacts")),
    companyId: v.optional(v.id("companies")),
    opportunityId: v.optional(v.id("opportunities")),
    assignedTo: v.id("users"),
    createdBy: v.id("users"),
  })
    .index("by_assigned_to", ["assignedTo"])
    .index("by_created_by", ["createdBy"])
    .index("by_contact", ["contactId"])
    .index("by_company", ["companyId"])
    .index("by_opportunity", ["opportunityId"])
    .index("by_status", ["status"])
    .index("by_due_date", ["dueDate"]),

  notes: defineTable({
    content: v.string(),
    contactId: v.optional(v.id("contacts")),
    companyId: v.optional(v.id("companies")),
    opportunityId: v.optional(v.id("opportunities")),
    createdBy: v.id("users"),
  })
    .index("by_contact", ["contactId"])
    .index("by_company", ["companyId"])
    .index("by_opportunity", ["opportunityId"])
    .index("by_created_by", ["createdBy"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
