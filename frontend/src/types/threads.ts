export type ThreadDetailResponse = {
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

export type Category = {
  id: number;
  slug: string;
  name: string;
  description?: string;
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
  createdAt: Date;
  updatedAt: Date;
};

export type ThreadListResult = {
    threads: ThreadSummary[];
    totalPages?: number;
    totalCount?: number;
    currentPage?: number;
    pageSize?: number;
};
