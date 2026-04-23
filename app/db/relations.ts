import { relations } from "drizzle-orm";
import { posts, images, tags, postTags, contacts } from "./schema";

export const postRelations = relations(posts, ({ many }) => ({
  postTags: many(postTags),
}));

export const tagRelations = relations(tags, ({ many }) => ({
  postTags: many(postTags),
}));

export const postTagRelations = relations(postTags, ({ one }) => ({
  post: one(posts, { fields: [postTags.postId], references: [posts.id] }),
  tag: one(tags, { fields: [postTags.tagId], references: [tags.id] }),
}));

export const imageRelations = relations(images, () => ({}));
export const contactRelations = relations(contacts, () => ({}));
