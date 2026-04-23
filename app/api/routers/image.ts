import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { images } from "@db/schema";

export const imageRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        album: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      let query = db.select().from(images).orderBy(desc(images.createdAt));

      if (input?.album) {
        query = query.where(eq(images.album, input.album)) as typeof query;
      }

      return query;
    }),

  create: adminQuery
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        url: z.string().min(1),
        album: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(images).values(input);
      return { id: Number(result[0].insertId), ...input };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(images).where(eq(images.id, input.id));
      return { success: true };
    }),
});
