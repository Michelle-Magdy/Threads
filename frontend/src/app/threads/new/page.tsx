"use client";
import { apiGet, apiPost, createBrowserApiClient } from "@/lib/api-client";
import { Show, useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import z from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { Category, ThreadDetailResponse } from "@/types/threads";
import { toast } from "sonner";

const ThreadSchema = z.object({
  title: z.string().trim().min(3),
  body: z.string().trim().min(10),
  categorySlug: z.string().trim().min(1, "Please select a category"),
});

type ThreadFormValues = z.infer<typeof ThreadSchema>;

function NewThreadPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { getToken } = useAuth();
  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        setIsLoading(true);
        const fetchedCategories = await apiGet<Category[]>(
          apiClient,
          "/api/v1/threads/categories",
        );

        if (!isMounted) return;
        setCategories(fetchedCategories);
      } catch (err: unknown) {
        console.error(err);
        toast.error("Failed to load categories");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, [apiClient]);

  const form = useForm<ThreadFormValues>({
    resolver: zodResolver(ThreadSchema),
    defaultValues: {
      title: "",
      body: "",
      categorySlug: "",
    },
  });

  async function onSubmit(values: ThreadFormValues) {
    try {
      setIsSaving(true);
      await apiPost<ThreadFormValues, ThreadDetailResponse>(
        apiClient,
        "/api/v1/threads",
        values,
      );
      toast.success("Thread added successfully");
      router.back();
    } catch (err) {
      toast.error("Cannot add new thread");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }

  const isDisabled = isLoading || isSaving;

  return (
    <Show when={"signed-in"}>
      {/* ✅ form now wraps CardContent AND CardFooter */}
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
          <CardHeader className="flex items-center gap-2 border-b-2 border-accent pb-3">
            <button
              type="button"
              className="cursor-pointer"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-6 w-6 text-primary" />
            </button>
            <CardTitle className="text-lg font-bold">Add New Thread</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3 grid-cols-3">
                <div className="grid gap-2 md:col-span-2 col-span-3">
                  <Label
                    htmlFor="title"
                    className="text-sm font-semibold text-foreground"
                  >
                    Title
                  </Label>
                  <Input
                    id="title"
                    placeholder="Enter a title"
                    {...form.register("title")}
                    disabled={isDisabled}
                    className="text-sm"
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.title.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-2 md:col-span-1 col-span-3">
                  <Label
                    htmlFor="categorySlug"
                    className="text-sm font-semibold text-foreground"
                  >
                    Category
                  </Label>
                  {/* ✅ Combobox now controlled by react-hook-form via Controller */}
                  <Controller
                    control={form.control}
                    name="categorySlug"
                    render={({ field }) => (
                      <Combobox
                        items={categories}
                        itemToStringValue={(item: Category) => item.slug}
                        itemToStringLabel={(item: Category) => item.name}
                        value={
                          categories.find((c) => c.slug === field.value) ?? null
                        }
                        onValueChange={(item: Category | null) =>
                          field.onChange(item?.slug ?? "")
                        }
                      >
                        <ComboboxInput placeholder="Select a Category" />
                        <ComboboxContent>
                          <ComboboxEmpty>No Categories found.</ComboboxEmpty>
                          <ComboboxList>
                            {(item) => (
                              <ComboboxItem key={item.id} value={item}>
                                {item.name}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                    )}
                  />
                  {form.formState.errors.categorySlug && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.categorySlug.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <Label
                  htmlFor="body"
                  className="text-sm font-semibold text-foreground"
                >
                  Body
                </Label>
                <Textarea
                  id="body"
                  placeholder="Enter a body..."
                  {...form.register("body")}
                  disabled={isDisabled}
                  className="text-sm"
                  rows={6}
                />
                {form.formState.errors.body && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.body.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter>
            {/* ✅ type="submit" now works since it's inside the form */}
            <Button
              type="submit"
              disabled={isDisabled}
              className="min-w-37.5 bg-primary text-primary-foreground hover:bg-primary/90 hover:cursor-pointer"
            >
              <Send />
              <span>{isSaving ? "Saving..." : "Save"}</span>
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Show>
  );
}

export default NewThreadPage;
