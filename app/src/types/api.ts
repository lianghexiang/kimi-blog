export type PostType = "blog" | "journal" | "thought";
export type PostStatus = "published" | "draft";

export type Permission = {
  id: number;
  name: string;
  resource: string;
  action: string;
  description: string | null;
};

export type Role = {
  id: number;
  name: string;
  description: string | null;
  permissions: Permission[];
};

export type User = {
  id: number;
  username: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  isActive: boolean;
  roles: Role[];
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

export type RegisterInput = {
  username: string;
  password: string;
  email?: string;
  name?: string;
};

export type LoginInput = {
  username: string;
  password: string;
};

export type UserCreateInput = {
  username: string;
  password: string;
  email?: string;
  name?: string;
  isActive?: boolean;
  roleIds?: number[];
};

export type UserUpdateInput = {
  username?: string;
  email?: string;
  name?: string;
  avatar?: string;
  isActive?: boolean;
  roleIds?: number[];
};

export type RoleCreateInput = {
  name: string;
  description?: string;
  permissionIds?: number[];
};

export type RoleUpdateInput = {
  name?: string;
  description?: string;
  permissionIds?: number[];
};
