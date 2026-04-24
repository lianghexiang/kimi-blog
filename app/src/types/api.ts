export type UserRole = "user" | "admin";
export type PostType = "blog" | "journal" | "thought";
export type PostStatus = "published" | "draft";

export type User = {
  id: number;
  unionId: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  lastSignInAt: string;
};

export type Tag = {
  id: number;
  name: string;
  color: string;
};

export type Post = {
  id: number;
  title: string;
  content: string;
  type: PostType;
  slug: string;
  coverImage: string | null;
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
};

export type PostWithTags = Post & { tags: Tag[] };

export type Image = {
  id: number;
  title: string;
  description: string | null;
  url: string;
  album: string | null;
  sortOrder: number;
  createdAt: string;
};

export type Contact = {
  id: number;
  name: string;
  email: string;
  message: string;
  createdAt: string;
};

export type PostListParams = {
  type?: PostType;
  status?: PostStatus;
  limit?: number;
  offset?: number;
};

export type PostCreateInput = {
  title: string;
  content: string;
  type: PostType;
  slug: string;
  coverImage?: string;
  status?: PostStatus;
  tagIds?: number[];
};

export type PostUpdateInput = {
  title?: string;
  content?: string;
  type?: PostType;
  slug?: string;
  coverImage?: string;
  status?: PostStatus;
  tagIds?: number[];
};

export type ImageCreateInput = {
  title: string;
  description?: string;
  url: string;
  album?: string;
};

export type TagCreateInput = {
  name: string;
  color?: string;
};

export type ContactCreateInput = {
  name: string;
  email: string;
  message: string;
};
