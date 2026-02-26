import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("transcriptions")
      .withIndex("by_position")
      .order("asc")
      .collect();
  },
});

export const save = mutation({
  args: {
    fileName: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
    text: v.string(),
    segments: v.array(
      v.object({
        text: v.string(),
        startSecond: v.number(),
        endSecond: v.number(),
      })
    ),
    language: v.optional(v.string()),
    durationInSeconds: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("transcriptions")
      .withIndex("by_position")
      .collect();
    for (const item of all) {
      await ctx.db.patch(item._id, { position: item.position + 1 });
    }
    return await ctx.db.insert("transcriptions", { ...args, position: 0 });
  },
});

export const getById = query({
  args: { id: v.id("transcriptions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const update = mutation({
  args: {
    id: v.id("transcriptions"),
    text: v.string(),
    segments: v.array(
      v.object({
        text: v.string(),
        startSecond: v.number(),
        endSecond: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("transcriptions") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) return;
    const removedPosition = item.position;
    await ctx.db.delete(args.id);
    const higher = await ctx.db
      .query("transcriptions")
      .withIndex("by_position", (q) => q.gt("position", removedPosition))
      .collect();
    for (const h of higher) {
      await ctx.db.patch(h._id, { position: h.position - 1 });
    }
  },
});

export const reorder = mutation({
  args: {
    id: v.id("transcriptions"),
    newPosition: v.number(),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) return;
    const oldPosition = item.position;
    if (oldPosition === args.newPosition) return;

    if (oldPosition < args.newPosition) {
      // Moving down: shift items in (old, new] up by -1
      const items = await ctx.db
        .query("transcriptions")
        .withIndex("by_position", (q) =>
          q.gt("position", oldPosition).lte("position", args.newPosition)
        )
        .collect();
      for (const i of items) {
        await ctx.db.patch(i._id, { position: i.position - 1 });
      }
    } else {
      // Moving up: shift items in [new, old) down by +1
      const items = await ctx.db
        .query("transcriptions")
        .withIndex("by_position", (q) =>
          q.gte("position", args.newPosition).lt("position", oldPosition)
        )
        .collect();
      for (const i of items) {
        await ctx.db.patch(i._id, { position: i.position + 1 });
      }
    }

    await ctx.db.patch(args.id, { position: args.newPosition });
  },
});
