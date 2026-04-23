import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { posts, tags, postTags } from "@db/schema";

export const postRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        type: z.enum(["blog", "journal", "thought"]).optional(),
        status: z.enum(["published", "draft"]).optional(),
        limit: z.number().min(1).max(50).optional().default(20),
        offset: z.number().min(0).optional().default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const filters = [];

      if (input?.type) {
        filters.push(eq(posts.type, input.type));
      }
      if (input?.status) {
        filters.push(eq(posts.status, input.status));
      }

      const whereClause = filters.length > 0 ? and(...filters) : undefined;

      const result = await db
        .select()
        .from(posts)
        .where(whereClause)
        .orderBy(desc(posts.createdAt))
        .limit(input?.limit ?? 20)
        .offset(input?.offset ?? 0);

      return result;
    }),

  getBySlug: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(posts)
        .where(eq(posts.slug, input.slug))
        .limit(1);

      if (result.length === 0) return null;

      // Get tags for this post
      const tagResults = await db
        .select({
          id: tags.id,
          name: tags.name,
          color: tags.color,
        })
        .from(postTags)
        .innerJoin(tags, eq(postTags.tagId, tags.id))
        .where(eq(postTags.postId, result[0].id));

      return {
        ...result[0],
        tags: tagResults,
      };
    }),

  create: adminQuery
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        type: z.enum(["blog", "journal", "thought"]),
        slug: z.string().min(1),
        coverImage: z.string().optional(),
        status: z.enum(["published", "draft"]).optional().default("published"),
        tagIds: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { tagIds, ...postData } = input;

      const result = await db.insert(posts).values(postData);
      const postId = Number(result[0].insertId);

      if (tagIds && tagIds.length > 0) {
        await db.insert(postTags).values(
          tagIds.map((tagId) => ({ postId, tagId }))
        );
      }

      return { id: postId, ...postData };
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        type: z.enum(["blog", "journal", "thought"]).optional(),
        slug: z.string().optional(),
        coverImage: z.string().optional(),
        status: z.enum(["published", "draft"]).optional(),
        tagIds: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, tagIds, ...updateData } = input;

      await db.update(posts).set(updateData).where(eq(posts.id, id));

      if (tagIds !== undefined) {
        await db.delete(postTags).where(eq(postTags.postId, id));
        if (tagIds.length > 0) {
          await db.insert(postTags).values(
            tagIds.map((tagId) => ({ postId: id, tagId }))
          );
        }
      }

      return { id, ...updateData };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(postTags).where(eq(postTags.postId, input.id));
      await db.delete(posts).where(eq(posts.id, input.id));
      return { success: true };
    }),
});
