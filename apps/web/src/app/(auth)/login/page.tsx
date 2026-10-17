"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { teacherLoginSchema, type TeacherLoginInput } from "@/features/auth/schemas";
import { useTeacherLogin } from "@/features/auth/hooks/use-login";
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
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const [showPassword, setShowPassword] = useState(false);
  const [lockedError, setLockedError] = useState<string | null>(null);

  const loginMutation = useTeacherLogin();

  const form = useForm<TeacherLoginInput>({
    resolver: zodResolver(teacherLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: TeacherLoginInput) => {
    setLockedError(null);
    loginMutation.mutate(values, {
      onSuccess: () => {
        toast.success("Welcome back!");
        const destination = next && next.startsWith("/") ? next : "/dashboard";
        router.push(destination);
      },
      onError: (error: any) => {
        if (error?.code === "ACCOUNT_LOCKED" || error?.status === 423) {
          setLockedError(
            error?.message ||
              "Your account has been temporarily locked due to too many failed login attempts. Please try again later or reset your password."
          );
        } else if (error?.code === "INVALID_CREDENTIALS") {
          form.setError("password", { message: "Invalid email or password." });
        } else {
          toast.error(error?.message || "Login failed. Please check your credentials.");
        }
      },
    });
  };

  return (
    <Card className="w-full shadow-sm border-border/60">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight">Teacher sign in</CardTitle>
        <CardDescription>
          Enter your teacher credentials to access your dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {lockedError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="size-4" />
            <AlertTitle>Account Locked</AlertTitle>
            <AlertDescription className="text-xs mt-1 leading-relaxed">
              {lockedError}{" "}
              <Link href="/forgot-password" className="underline font-semibold block mt-1">
                Forgot your password?
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {loginMutation.isError &&
          !lockedError &&
          (loginMutation.error as any)?.code !== "INVALID_CREDENTIALS" && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{loginMutation.error?.message}</AlertDescription>
            </Alert>
          )}


        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="teacher@university.edu"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pr-10"
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

            <Button
              type="submit"
              className="w-full mt-2"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Sign in
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-border/40 p-4">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-primary underline-offset-4 hover:underline">
            Register here
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full shadow-sm border-border/60 p-8 text-center text-muted-foreground">
          Loading sign in form...
        </Card>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
