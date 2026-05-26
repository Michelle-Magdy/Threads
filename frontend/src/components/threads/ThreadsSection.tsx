"use client";

import { apiGet, createBrowserApiClient } from "@/lib/api-client";
import { Category, ThreadListResult, ThreadSummary } from "@/types/threads";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import Link from "next/link";
import { Button } from "../ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";

function ThreadsSection() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [paging, setPaging] = useState({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    pageSize: 20,
  });

  const activeCategory = searchParams.get("category") ?? "all";
  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);

  // Stable primitives derived from searchParams
  const categoryParam = searchParams.get("category") ?? "all";
  const searchParam = searchParams.get("q") ?? "";
  const pageParam = Number(searchParams.get("page") ?? "1");

  // Load categories once on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const fetchedCategories = await apiGet<Category[]>(
          apiClient,
          "/api/v1/threads/categories",
        );
        setCategories(fetchedCategories);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load categories");
      }
    }
    loadCategories();
  }, [apiClient]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadThreads() {
      try {
        setIsLoading(true);

        const result = await apiGet<ThreadListResult>(
          apiClient,
          "/api/v1/threads/threads",
          {
            signal: controller.signal,
            params: {
              page: pageParam,
              category: categoryParam !== "all" ? categoryParam : undefined,
              q: searchParam.trim() || undefined,
            },
          },
        );
      
        const nextThreads = Array.isArray(result.threads) ? result.threads : [];

        setThreads(nextThreads);
        setPaging({
          totalCount: Number(result.totalCount ?? 0),
          totalPages: Number(result.totalPages ?? 0),
          currentPage: Number(result.currentPage ?? 1),
          pageSize: Number(result.pageSize ?? 20),
        });
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        console.error(err);
        toast.error("Failed to load threads");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadThreads();
    return () => controller.abort();
  }, [apiClient, categoryParam, searchParam, pageParam]);

  function applyFilters(
    currentCategory: string,
    currentSearchVal: string,
    newPage: number = 1,
  ) {
    const params = new URLSearchParams();

    if (currentCategory && currentCategory !== "all") {
      params.set("category", currentCategory);
    }
    if (currentSearchVal.trim()) {
      params.set("q", currentSearchVal.trim());
    }
    if (newPage > 1) {
      params.set("page", newPage.toString());
    }

    router.push(`?${params.toString()}`);
  }

  // Returns every page number from 1 to totalPages — no ellipsis
  const allPageNumbers = useCallback((): number[] => {
    return Array.from({ length: paging.totalPages }, (_, i) => i + 1);
  }, [paging.totalPages]);

  return (
    <div className="flex w-full flex-col gap-6 lg:flex-row">
      <aside className="w-full shrink-0 lg:w-72">
        <Card className="sticky top-24 border-sidebar-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Categories</CardTitle>
              <Link href="/threads/new">
                <Button
                  size="icon"
                  className="h-8 w-8 rounded-full bg-primary text-primary-foreground shadow-sm shadow-primary/40 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <button
              onClick={() => applyFilters("all", search, 1)}
              className={`flex w-full items-center p-3 text-sm font-medium transition-colors rounded-lg cursor-pointer hover:bg-muted/50 ${
                activeCategory === "all"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => applyFilters(cat.slug, search, 1)}
                className={`flex w-full items-center p-3 text-sm font-medium transition-colors rounded-lg cursor-pointer hover:bg-muted/50 ${
                  activeCategory === cat.slug
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </CardContent>
        </Card>
      </aside>

      <div className="flex-1 space-y-6">
        <Card className="border-border/70 bg-card/95">
          <CardHeader className="pb-5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Latest Threads
            </h1>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex flex-1 items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="search threads..."
                    className="pl-10 bg-secondary/80 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        applyFilters(activeCategory, search, 1);
                      }
                    }}
                  />
                </div>
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                  onClick={() => applyFilters(activeCategory, search, 1)}
                >
                  Search
                </Button>
              </div>
            </div>
            <Link href={"/threads/new"}>
              <Button className="cursor-pointer">
                <Plus className="w-4 h-4" />
                <span>New Thread</span>
              </Button>
            </Link>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center rounded-lg border border-border bg-card py-10">
              <p className="text-sm text-muted-foreground">
                Loading Threads...
              </p>
            </div>
          )}

          {!isLoading && threads.length === 0 && (
            <Card className="border-dashed border-border bg-card">
              <CardContent className="py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  No threads found. Create your first thread
                </p>
              </CardContent>
            </Card>
          )}

          {!isLoading &&
            threads.map((thread) => (
              <Card
                key={thread.id}
                className="group cursor-pointer border-border/70 bg-card transition-colors duration-150 border hover:border-primary/80 hover:bg-card/90"
              >
                <Link href={`threads/${thread.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge
                            variant={"outline"}
                            className="border-border/70 bg-secondary/70 text-[12px]"
                          >
                            {thread.category.name}
                          </Badge>
                          {thread.author?.handle && (
                            <Badge className="text-chart-1 bg-chart-1/15">
                              <span>@{thread.author.handle}</span>
                            </Badge>
                          )}
                          <span className="text-muted-foreground">
                            {new Date(thread.createdAt).toLocaleDateString(
                              "en-US",
                            )}
                          </span>
                        </div>
                        <CardTitle className="text-lg text-foreground font-semibold group-hover:text-primary transition-colors duration-150">
                          {thread.title}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pb-4">
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {thread.excerpt}
                    </p>
                  </CardContent>
                </Link>
              </Card>
            ))}

          {!isLoading && threads.length > 0 && paging.totalPages > 1 && (
            <div className="pt-4">
              <Pagination>
                <PaginationContent className="flex-wrap gap-1">
                  {/* Previous */}
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (paging.currentPage > 1) {
                          applyFilters(
                            activeCategory,
                            search,
                            paging.currentPage - 1,
                          );
                        }
                      }}
                      className={
                        paging.currentPage <= 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {/* All page numbers */}
                  {allPageNumbers().map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (page !== paging.currentPage) {
                            applyFilters(activeCategory, search, page);
                          }
                        }}
                        isActive={page === paging.currentPage}
                        className={
                          page === paging.currentPage
                            ? "pointer-events-none font-semibold border-primary text-primary"
                            : "cursor-pointer"
                        }
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  {/* Next */}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (paging.currentPage < paging.totalPages) {
                          applyFilters(
                            activeCategory,
                            search,
                            paging.currentPage + 1,
                          );
                        }
                      }}
                      className={
                        paging.currentPage >= paging.totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>

              <p className="text-center text-xs text-muted-foreground mt-2">
                Page {paging.currentPage} of {paging.totalPages} (
                {paging.totalCount} total)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ThreadsSection;
