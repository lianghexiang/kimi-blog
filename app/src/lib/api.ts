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
    me: () => apiFetch<{ id: number; unionId: string; name: string | null; email: string | null; avatar: string | null; role: string; createdAt: string; updatedAt: string; lastSignInAt: string }>("/auth/me"),
    logout: () => apiFetch<{ success: true }>("/auth/logout", { method: "POST" }),
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
