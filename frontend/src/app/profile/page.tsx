"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiGet, apiPatch, createBrowserApiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { UserProfileResponse } from "@/types/user";
import { Show, useAuth } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";


const ProfileSchema = z.object({
  displayName: z.string().trim().max(50).min(3).optional(),
  handle: z.string().trim().max(30).min(3).optional(),
  bio: z.string().trim().max(500).optional(),
  avatarUrl: z.url().optional(),
});

type ProfileFormValues = z.infer<typeof ProfileSchema>;



function ProfilePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { getToken } = useAuth();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileSchema),
    mode:"onBlur",
    reValidateMode:"onChange",
    defaultValues: {
      displayName: "",
      avatarUrl: "",
      handle: "",
      bio: "",
    },
  });

  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);

  useEffect(() => {
    let isMounted = true;

    async function loadUserProfile() {
      try {
           setIsLoading(true);  
        const getUserInfo = await apiGet<UserProfileResponse>(
          apiClient,
          "/api/v1/me",
        );
        if (isMounted) {
          form.reset({
            displayName: getUserInfo.displayName ?? "",
            handle: getUserInfo.handle ?? "",
            avatarUrl: getUserInfo.avatarURL ?? "",
            bio: getUserInfo.bio ?? "",
          });
        }
      } catch (err: unknown) {
        console.log(err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadUserProfile();
     return () => {
       isMounted = false; // ✅ Cleanup on unmount
     };
  }, [apiClient, form]);

  const displayNameValue = form.watch("displayName");
  const handleValue = form.watch("handle");
  const avatarUrlValue = form.watch("avatarUrl");


  async function onSubmit(values: ProfileFormValues) {
    try{
        setIsSaving(true);
        const payload:Record<string,string> ={};
        if(values.displayName) payload.displayName = values.displayName;
        if(values.handle) payload.handle = values.handle.toLowerCase();
        if(values.bio) payload.bio = values.bio;
        if(values.avatarUrl) payload.avatarUrl = values.avatarUrl;
        
        const apiResponse = await apiPatch<typeof payload,UserProfileResponse>(apiClient,payload,"/api/v1/me");

        form.reset({
            displayName: apiResponse.displayName ?? "",
            handle:apiResponse.handle??"",
            bio:apiResponse.bio??"",
            avatarUrl:apiResponse.avatarURL??""
        })

        toast.success("Profile updated successfully!",{
            description:"Your changes are saved"
        });

    }catch(err){
        toast.error("cannot update the user")
        console.log(err);
    }finally{
        setIsSaving(false);
    }
  }
  return (
    <>
      <Show when={"signed-in"}>
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 ">
          <div>
            <h1 className="flex items-center text-3xl font-bold tracking-tight text-foreground gap-2">
              <User className="w-8 h-8 text-primary" />
              Profile Settings
            </h1>
            <p className="mt-1 text-sm text-muted-foreground ">
              Manage your profile information
            </p>
          </div>
          <Card className="border-border/70 bg-card">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-6">
                <Avatar className="h-20 w-20">
                  {avatarUrlValue && (
                    <AvatarImage
                      src={avatarUrlValue || "/placeholder.xyz"}
                      alt={displayNameValue ?? ""}
                    />
                  )}
                  <AvatarFallback>
                    {displayNameValue?.split(" ")[0][0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-2xl text-foreground">
                    {displayNameValue || "Your display name"}
                  </CardTitle>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium",
                        handleValue
                          ? "bg-chart-1/10 text-chart-1"
                          : "bg-accent text-accent-foreground",
                      )}
                    >
                      {handleValue ? `@${handleValue}` : "@handle"}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-border/70 bg-card">
            <CardHeader>
              <CardTitle className="text-lg text-foreground font-bold">
                Edit Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-6"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <div className="grid gap-6 md:grid-cols-2">
                  <Field className="">
                    <FieldLabel
                      htmlFor="displayName"
                      className="text-sm font-semibold text-foreground"
                    >
                      Display Name
                    </FieldLabel>
                    <Input
                      id="displayName"
                      placeholder="Michelle Magdy"
                      {...form.register("displayName")}
                      disabled={isLoading || isSaving}
                      className="border-border bg-background/60 text-sm"
                    />
                    {form.formState.errors.displayName && (
                      <FieldError className="text-sm text-destructive">
                        {form.formState.errors.displayName.message}
                      </FieldError>
                    )}
                  </Field>
                  {/*implement error state */}

                  <Field className="">
                    <FieldLabel
                      htmlFor="handle"
                      className="text-sm font-semibold text-foreground"
                    >
                      Handle
                    </FieldLabel>
                    <Input
                      id="handle"
                      placeholder="@Michelle_Magdy"
                      {...form.register("handle")}
                      disabled={isLoading || isSaving}
                      className="border-border bg-background/60 text-sm"
                    />
                    {form.formState.errors.handle && (
                      <FieldError className="text-sm text-destructive">
                        {form.formState.errors.handle.message}
                      </FieldError>
                    )}
                  </Field>
                  {/*implement error state */}
                </div>
                <Field className="">
                  <FieldLabel
                    htmlFor="bio"
                    className="text-sm font-semibold text-foreground"
                  >
                    Bio
                  </FieldLabel>
                  <Textarea
                    id="bio"
                    placeholder="I am a human"
                    {...form.register("bio")}
                    disabled={isLoading || isSaving}
                    className="border-border bg-background/60 text-sm"
                    rows={4}
                  />
                  {form.formState.errors.bio && (
                    <FieldError className="text-sm text-destructive">
                      {form.formState.errors.bio.message}
                    </FieldError>
                  )}
                </Field>
                {/*implement error state */}

                <Field className="">
                  <FieldLabel
                    htmlFor="avatarUrl"
                    className="text-sm font-semibold text-foreground"
                  >
                    Avatar URL
                  </FieldLabel>
                  <Input
                    id="avatarUrl"
                    placeholder="http://url.com"
                    {...form.register("avatarUrl")}
                    disabled={isLoading || isSaving}
                    className="border-border bg-background/60 text-sm"
                  />
                  {form.formState.errors.avatarUrl && (
                    <FieldError className="text-sm text-destructive">
                      {form.formState.errors.avatarUrl.message}
                    </FieldError>
                  )}
                </Field>
                {/*implement error state */}

                <CardFooter className="p-0">
                  <Button
                    type="submit"
                    disabled={isLoading || isSaving}
                    className="min-w-37.5 bg-primary text-primary-foreground hover:bg-primary/90 hover:cursor-pointer"
                  >
                    <Save className="mr-2 w-4 h-4" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </div>
      </Show>
      <Show when="signed-out"></Show>
    </>
  );
}

export default ProfilePage;
