import type {
  Post,
  PostWithTags,
  PostCreateInput,
  PostUpdateInput,
  Image,
  ImageCreateInput,
  Album,
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
  SiteConfig,
  AboutCarousel,
  AboutCarouselCreateInput,
  AboutCarouselUpdateInput,
  AboutCarouselReorderInput,
} from "@/types/api";

const API_BASE = "/api";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: isFormData
      ? options?.headers
      : {
          "Content-Type": "application/json",
          ...options?.headers,
        },
  });
  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ message: res.statusText, detail: res.statusText }));
    throw new Error(err.detail || err.message || res.statusText);
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
    me: () => apiFetch<User | null>("/auth/me"),
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
    list: (params?: { type?: string; status?: string; tag?: string; limit?: number; offset?: number }) =>
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
    getAlbums: () => apiFetch<string[]>("/images/albums"),
    create: (data: ImageCreateInput) =>
      apiFetch<Image>("/images", { method: "POST", body: JSON.stringify(data) }),
    upload: (formData: FormData) => apiFetch<Image>("/images/upload", {
      method: "POST",
      body: formData,
    }),
    delete: (id: number) => apiFetch<{ success: true }>(`/images/${id}`, { method: "DELETE" }),
  },

  albums: {
    list: () => apiFetch<Album[]>("/albums"),
    create: (data: { name: string }) =>
      apiFetch<Album>("/albums", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<{ success: true }>(`/albums/${id}`, { method: "DELETE" }),
  },

  tags: {
    list: () => apiFetch<Tag[]>("/tags"),
    create: (data: TagCreateInput) =>
      apiFetch<Tag>("/tags", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: TagCreateInput) =>
      apiFetch<Tag>(`/tags/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<{ success: true }>(`/tags/${id}`, { method: "DELETE" }),
    stats: () => apiFetch<Record<string, number>>("/tags/stats"),
  },

  contacts: {
    submit: (data: ContactCreateInput) =>
      apiFetch<Contact>("/contacts", { method: "POST", body: JSON.stringify(data) }),
    list: () => apiFetch<Contact[]>("/contacts"),
  },

  siteConfigs: {
    list: () => apiFetch<SiteConfig[]>("/site-configs"),
    update: (data: Record<string, string | null>) =>
      apiFetch<SiteConfig[]>("/site-configs", { method: "PUT", body: JSON.stringify({ configs: data }) }),
  },

  aboutCarousel: {
    list: () => apiFetch<AboutCarousel[]>("/about-carousel"),
    create: (data: AboutCarouselCreateInput) =>
      apiFetch<AboutCarousel>("/about-carousel", { method: "POST", body: JSON.stringify(data) }),
    upload: (formData: FormData) =>
      apiFetch<AboutCarousel>("/about-carousel/upload", { method: "POST", body: formData }),
    update: (id: number, data: AboutCarouselUpdateInput) =>
      apiFetch<AboutCarousel>(`/about-carousel/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<{ success: true }>(`/about-carousel/${id}`, { method: "DELETE" }),
    reorder: (items: AboutCarouselReorderInput[]) =>
      apiFetch<AboutCarousel[]>("/about-carousel/reorder", { method: "PUT", body: JSON.stringify({ items }) }),
  },
};
