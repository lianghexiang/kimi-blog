import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { tags } from "@db/schema";

export const tagRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(tags);
  }),

  create: adminQuery
    .input(
      z.object({
        name: z.string().min(1),
        color: z.string().default("#3B82F6"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(tags).values(input);
      return { id: Number(result[0].insertId), ...input };
    }),
});
