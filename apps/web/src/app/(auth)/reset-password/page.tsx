"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";

import { resetPasswordApi } from "@/features/auth/api";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const resetPasswordFormSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;

function ResetPasswordFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  if (!token) {
    return (
      <Card className="w-full shadow-sm border-border/60">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-destructive">Missing Token</CardTitle>
          <CardDescription>
            This password reset link is invalid or incomplete.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              No reset token was found in the link. Please request a new password reset link.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-border/40 p-4">
          <Link href="/forgot-password" className={cn(buttonVariants({ variant: "outline" }))}>
            Request reset link
          </Link>
          <Link href="/login" className={cn(buttonVariants({ variant: "default" }))}>
            Back to sign in
          </Link>

        </CardFooter>
      </Card>
    );
  }

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setIsPending(true);
    setErrorMessage(null);
    try {
      await resetPasswordApi({
        token,
        newPassword: values.password,
      });
      setIsSuccess(true);
      toast.success("Password reset successfully! You can now sign in.");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      if (err?.code === "INVALID_OR_EXPIRED_TOKEN" || err?.status === 400) {
        setErrorMessage("This password reset token has expired or is invalid. Please request a new one.");
      } else {
        setErrorMessage(err?.message || "Failed to reset password. Please try again.");
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card className="w-full shadow-sm border-border/60">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight">Set new password</CardTitle>
        <CardDescription>
          Choose a secure new password of at least 8 characters.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSuccess ? (
          <div className="flex flex-col items-center text-center py-4 space-y-3">
            <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <CheckCircle2 className="size-6" />
            </div>
            <h3 className="font-semibold text-lg">Password reset complete</h3>
            <p className="text-sm text-muted-foreground">
              Redirecting you to sign in...
            </p>
          </div>
        ) : (
          <>
            {errorMessage && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Reset Failed</AlertTitle>
                <AlertDescription className="text-xs mt-1">
                  {errorMessage}{" "}
                  <Link href="/forgot-password" className="underline font-semibold block mt-1">
                    Request a new link
                  </Link>
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pr-10"
                            autoFocus
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowPassword((prev) => !prev)}
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            <span className="sr-only">Toggle password visibility</span>
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm new password</FormLabel>
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full mt-2" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Reset password
                </Button>
              </form>
            </Form>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-center border-t border-border/40 p-4">
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          <span>Back to sign in</span>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full shadow-sm border-border/60 p-8 text-center text-muted-foreground">
          Loading reset form...
        </Card>
      }
    >
      <ResetPasswordFormContent />
    </Suspense>
  );
}
