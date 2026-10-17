"use client";

import React, { Suspense, use, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Eye, EyeOff, GraduationCap, Loader2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { useStudentLogin } from "@/features/auth/hooks/use-login";
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

const studentLoginFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type StudentLoginFormValues = z.infer<typeof studentLoginFormSchema>;

function JoinTestContent({ testId }: { testId: string }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

  const studentLoginMutation = useStudentLogin();

  const form = useForm<StudentLoginFormValues>({
    resolver: zodResolver(studentLoginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: StudentLoginFormValues) => {
    setCustomError(null);
    studentLoginMutation.mutate(
      {
        testId,
        email: values.email,
        password: values.password,
      },
      {
        onSuccess: () => {
          if (typeof window !== "undefined") {
            sessionStorage.setItem("exam_test_id", testId);
          }
          toast.success("Login verified! Redirecting to the exam lobby...");
          router.push("/exam/lobby");
        },
        onError: (err: any) => {
          const code = err?.code;
          if (code === "TEST_NOT_PUBLISHED" || err?.status === 403) {
            setCustomError("This examination has not yet been published by the instructor. Please wait for an invitation.");
          } else if (code === "TEST_ENDED") {
            setCustomError("The test window for this examination has already closed.");
          } else if (code === "ACCOUNT_LOCKED" || err?.status === 423) {
            setCustomError("Your account has been locked due to too many failed login attempts. Please contact your instructor.");
          } else if (code === "INVALID_CREDENTIALS" || err?.status === 401) {
            form.setError("password", { message: "Invalid email or credentials. Use the password sent to your email." });
          } else {
            toast.error(err?.message || "Failed to sign in. Please verify your credentials.");
          }
        },
      }
    );
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-muted/20">
      <Card className="w-full max-w-md shadow-sm border-border/60">
        <CardHeader className="text-center space-y-2">
          <div className="size-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mx-auto shadow-sm">
            <GraduationCap className="size-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Student Exam Login</CardTitle>
          <CardDescription>
            Enter your student email and test password to join the examination lobby.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="size-4" />
              <AlertTitle>Unable to Join</AlertTitle>
              <AlertDescription className="text-xs mt-1 leading-relaxed">
                {customError}
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="student@university.edu"
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
                    <FormLabel>Exam Password</FormLabel>
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
                disabled={studentLoginMutation.isPending}
              >
                {studentLoginMutation.isPending && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                Enter Exam Lobby
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center border-t border-border/40 p-4 text-center">
          <p className="text-xs text-muted-foreground">
            Credentials were sent to your email by your instructor. Never share your password.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function JoinTestPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const resolvedParams = use(params);
  const testId = resolvedParams.testId;

  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8 text-center text-muted-foreground">
            Loading student login...
          </Card>
        </div>
      }
    >
      <JoinTestContent testId={testId} />
    </Suspense>
  );
}
