export type CategoryRow = {
  id: number;
  slug: string;
  name: string;
  description?: string;
};

export type Category = {
  id: number;
  slug: string;
  name: string;
  description?: string;
};

export function hydrateCategoryRow(row: CategoryRow): Category {
  return row;
}

export type Thread = {
  id: number;
  categoryId: number;
  authorId: number;
  title: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
};
export type ThreadRow = {
  id: number;
  category_id: number;
  author_id: number;
  title: string;
  body: string;
  create_at: Date;
  updated_at: Date;
};

export type ThreadDetail = {
  id: number;
  category: {
    name: string;
    slug: string;
  };
  author: {
    displayName: string | null;
    handle: string | null;
    avatarUrl: string | null;
  };
  title: string;
  body: string;
  createAt: Date;
  updatedAt: Date;
};

export type ThreadDetailRow = {
  id: number;
  category_name: string;
  category_slug: string;
  author_display_name: string | null;
  author_handle: string | null;
  author_avatar_url: string | null;
  title: string;
  body: string;
  create_at: Date;
  updated_at: Date;
};

export function hydrateThreadDetailRow(row: ThreadDetailRow): ThreadDetail {
  return {
    id: row.id,
    category: {
      name: row.category_name,
      slug: row.category_slug,
    },
    author: {
      displayName: row.author_display_name,
      handle: row.author_handle,
      avatarUrl: row.author_avatar_url,
    },
    title: row.title,
    body: row.body,
    createAt: row.create_at,
    updatedAt: row.updated_at,
  };
}

export function hydrateThreadRow(row: ThreadRow): Thread {
  return {
    id: row.id,
    authorId: row.author_id,
    categoryId: row.category_id,
    title: row.title,
    body: row.body,
    createdAt: row.create_at,
    updatedAt: row.updated_at,
  };
}

export type ThreadListFilter = {
  page: number;
  limit: number;
  categorySlug?: string;
  search?: string;
  sort: "new" | "old";
};

export type ThreadSummary = {
  id: number;
  category: {
    name: string;
    slug: string;
  };
  author: {
    displayName: string | null;
    handle: string | null;
    avatarUrl: string | null;
  };
  title: string;
  excerpt: string;
  createAt: Date;
  updatedAt: Date;
};

export type ThreadSummaryRow = {
  id: number;
  category_name: string;
  category_slug: string;
  author_display_name: string | null;
  author_handle: string | null;
  author_avatar_url: string | null;
  title: string;
  excerpt: string;
  create_at: Date;
  updated_at: Date;
};

export function hydrateThreadSummaryRow(row: ThreadSummaryRow): ThreadSummary {
  return {
    id: row.id,
    category: {
      name: row.category_name,
      slug: row.category_slug,
    },
    author: {
      displayName: row.author_display_name,
      handle: row.author_handle,
      avatarUrl: row.author_avatar_url,
    },
    title: row.title,
    excerpt: row.excerpt,
    createAt: row.create_at,
    updatedAt: row.updated_at,
  };
}