import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  transcriptions: defineTable({
    fileName: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
    text: v.string(),
    segments: v.array(
      v.object({
        text: v.string(),
        startSecond: v.number(),
        endSecond: v.number(),
      }),
    ),
    transliteratedText: v.optional(v.string()),
    transliteratedSegments: v.optional(
      v.array(
        v.object({
          text: v.string(),
          startSecond: v.number(),
          endSecond: v.number(),
        }),
      ),
    ),
    language: v.optional(v.string()),
    durationInSeconds: v.optional(v.number()),
    isTranscribed: v.boolean(),
    position: v.number(),
  })
    .index("by_position", ["position"])
    .index("by_fileName_fileSize", ["fileName", "fileSize"]),
});
