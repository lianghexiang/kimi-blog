import type {
  Post,
  PostWithTags,
  PostCreateInput,
  PostUpdateInput,
  Image,
  ImageCreateInput,
  Tag,
  TagCreateInput,
  Contact,
  ContactCreateInput,
  User,
  RegisterInput,
  LoginInput,
  UserCreateInput,
  UserUpdateInput,
  Role,
  RoleCreateInput,
  RoleUpdateInput,
  Permission,
} from "@/types/api";

const API_BASE = "/api";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || res.statusText);
  }
  return res.json();
}

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      search.append(key, String(value));
    }
  }
  return search.toString();
}

export const api = {
  ping: () => apiFetch<{ ok: boolean; ts: number }>("/ping"),

  auth: {
    me: () => apiFetch<User>("/auth/me"),
    login: (data: LoginInput) =>
      apiFetch<{ success: true }>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
    register: (data: RegisterInput) =>
      apiFetch<User>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
    logout: () => apiFetch<{ success: true }>("/auth/logout", { method: "POST" }),
  },

  users: {
    list: () => apiFetch<User[]>("/users"),
    get: (id: number) => apiFetch<User>(`/users/${id}`),
    create: (data: UserCreateInput) =>
      apiFetch<User>("/users", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: UserUpdateInput) =>
      apiFetch<User>(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<{ success: true }>(`/users/${id}`, { method: "DELETE" }),
  },

  roles: {
    list: () => apiFetch<Role[]>("/roles"),
    permissions: () => apiFetch<Permission[]>("/roles/permissions"),
    create: (data: RoleCreateInput) =>
      apiFetch<Role>("/roles", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: RoleUpdateInput) =>
      apiFetch<Role>(`/roles/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<{ success: true }>(`/roles/${id}`, { method: "DELETE" }),
  },

  posts: {
    list: (params?: { type?: string; status?: string; limit?: number; offset?: number }) =>
      apiFetch<Post[]>(`/posts?${qs(params ?? {})}`),
    getBySlug: (slug: string) => apiFetch<PostWithTags>(`/posts/${slug}`),
    create: (data: PostCreateInput) =>
      apiFetch<Post>("/posts", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: PostUpdateInput) =>
      apiFetch<Post>(`/posts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<{ success: true }>(`/posts/${id}`, { method: "DELETE" }),
  },

  images: {
    list: (params?: { album?: string }) =>
      apiFetch<Image[]>(`/images?${qs(params ?? {})}`),
    create: (data: ImageCreateInput) =>
      apiFetch<Image>("/images", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<{ success: true }>(`/images/${id}`, { method: "DELETE" }),
  },

  tags: {
    list: () => apiFetch<Tag[]>("/tags"),
    create: (data: TagCreateInput) =>
      apiFetch<Tag>("/tags", { method: "POST", body: JSON.stringify(data) }),
  },

  contacts: {
    submit: (data: ContactCreateInput) =>
      apiFetch<Contact>("/contacts", { method: "POST", body: JSON.stringify(data) }),
    list: () => apiFetch<Contact[]>("/contacts"),
  },
};
