"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { forgotPasswordSchema, type ForgotPasswordInput } from "@/features/auth/schemas";
import { forgotPasswordApi } from "@/features/auth/api";
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

export default function ForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordInput) => {
    setIsPending(true);
    try {
      await forgotPasswordApi(values);
      setSubmittedEmail(values.email);
      toast.success("Password reset link requested.");
    } catch {
      // Per spec, do not reveal if the email exists, show success state regardless
      setSubmittedEmail(values.email);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card className="w-full shadow-sm border-border/60">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight">Forgot password</CardTitle>
        <CardDescription>
          Enter your registered email address to receive a password reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submittedEmail ? (
          <div className="flex flex-col items-center text-center py-4 space-y-3">
            <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <CheckCircle2 className="size-6" />
            </div>
            <h3 className="font-semibold text-lg">Check your inbox</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              If an account with <strong className="text-foreground">{submittedEmail}</strong> exists,
              we have sent instructions to reset your password.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSubmittedEmail(null);
                form.reset();
              }}
            >
              Send another email
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="email"
                          placeholder="teacher@university.edu"
                          className="pl-9"
                          autoFocus
                          {...field}
                        />
                        <Mail className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full mt-2" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Send reset link
              </Button>
            </form>
          </Form>
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
