import { authRouter } from "./auth-router";
import { postRouter } from "./routers/post";
import { imageRouter } from "./routers/image";
import { tagRouter } from "./routers/tag";
import { contactRouter } from "./routers/contact";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  post: postRouter,
  image: imageRouter,
  tag: tagRouter,
  contact: contactRouter,
});

export type AppRouter = typeof appRouter;
