"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  Eye,
  FileQuestion,
  GraduationCap,
  MoreVertical,
  Pencil,
  PlusCircle,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";

import { useTests } from "@/features/tests/hooks/use-tests";
import { deleteTestApi } from "@/features/tests/api";
import { testKeys } from "@/features/tests/keys";
import { useQueryClient } from "@tanstack/react-query";
import type { TestSummary } from "@/features/tests/schemas";

import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const currentStatus = (searchParams.get("status") as "DRAFT" | "PUBLISHED" | null) || undefined;
  const currentPage = Number(searchParams.get("page")) || 1;

  const { data: response, isLoading, isError, error, refetch } = useTests({
    status: currentStatus,
    page: currentPage,
    limit: 10,
  });

  const [deletingTest, setDeletingTest] = useState<TestSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const tests = response?.data || [];
  const meta = response?.meta;

  const handleStatusTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    params.set("page", "1");
    router.push(`/dashboard?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/dashboard?${params.toString()}`);
  };

  const confirmDelete = async () => {
    if (!deletingTest) return;
    setIsDeleting(true);
    try {
      await deleteTestApi(deletingTest.id);
      toast.success(`Test "${deletingTest.title}" deleted.`);
      queryClient.invalidateQueries({ queryKey: testKeys.all });
      setDeletingTest(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete test.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Teacher Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your proctored assessments, view student submissions, and tune anti-cheating rules.
          </p>
        </div>
        <Link
          href="/tests/new"
          className={cn(buttonVariants({ variant: "default" }), "gap-2 shadow-sm shrink-0")}
        >
          <PlusCircle className="size-4" />
          <span>New test</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <Tabs
          value={currentStatus || "ALL"}
          onValueChange={handleStatusTabChange}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid grid-cols-3 w-full sm:w-[320px]">
            <TabsTrigger value="ALL">All Tests</TabsTrigger>
            <TabsTrigger value="DRAFT">Drafts</TabsTrigger>
            <TabsTrigger value="PUBLISHED">Published</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <Card className="border-border/60">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </CardContent>
        </Card>
      ) : isError ? (
        <Alert variant="destructive">
          <AlertTitle>Failed to load tests</AlertTitle>
          <AlertDescription className="mt-1 flex items-center justify-between">
            <span>{(error as any)?.message || "An unexpected error occurred."}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : tests.length === 0 ? (
        <Card className="border-dashed border-2 border-border/80 bg-muted/10 text-center py-16">
          <CardContent className="flex flex-col items-center justify-center space-y-3">
            <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <FileQuestion className="size-6" />
            </div>
            <CardTitle className="text-lg">No tests found</CardTitle>
            <CardDescription className="max-w-sm text-sm">
              {currentStatus
                ? `You have no ${currentStatus.toLowerCase()} tests currently.`
                : "Get started by creating your first online assessment with automated proctoring."}
            </CardDescription>
            <Link
              href="/tests/new"
              className={cn(buttonVariants({ variant: "default" }), "mt-3 gap-2")}
            >
              <PlusCircle className="size-4" />
              <span>Create test</span>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/60 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="font-semibold text-foreground">Test Title</TableHead>
                <TableHead className="font-semibold text-foreground">Schedule</TableHead>
                <TableHead className="font-semibold text-foreground">Duration</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="font-semibold text-foreground">Participants</TableHead>
                <TableHead className="w-[80px] text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tests.map((test) => {
                const formattedDate = test.startsAt
                  ? format(new Date(test.startsAt), "MMM d, yyyy h:mm a")
                  : "Not scheduled";

                return (
                  <TableRow key={test.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium text-foreground py-3.5">
                      <Link
                        href={`/tests/${test.id}`}
                        className="hover:underline underline-offset-4 font-semibold text-primary"
                      >
                        {test.title}
                      </Link>
                    </TableCell>

                    <TableCell className="text-muted-foreground text-sm">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-muted-foreground" />
                        <span>{formattedDate}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="size-3.5" />
                        <span>{test.durationMinutes} mins</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {test.status === "PUBLISHED" ? (
                        <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600 text-white font-medium text-xs">
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="font-medium text-xs">
                          Draft
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="size-3.5" />
                        <span>
                          <strong className="text-foreground">{test.submittedCount ?? 0}</strong> submitted / {test.participantCount ?? 0} total
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreVertical className="size-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/tests/${test.id}`)}
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 size-4" />
                            <span>View details</span>
                          </DropdownMenuItem>

                          {test.status === "DRAFT" && (
                            <DropdownMenuItem
                              onClick={() => router.push(`/tests/${test.id}/edit`)}
                              className="cursor-pointer"
                            >
                              <Pencil className="mr-2 size-4" />
                              <span>Edit test</span>
                            </DropdownMenuItem>
                          )}


                          {test.status === "DRAFT" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeletingTest(test)}
                                className="text-destructive focus:text-destructive cursor-pointer"
                              >
                                <Trash2 className="mr-2 size-4" />
                                <span>Delete draft</span>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          {meta && meta.total > meta.limit && (
            <div className="flex items-center justify-between border-t border-border/40 px-6 py-4">
              <span className="text-xs text-muted-foreground">
                Showing {((meta.page - 1) * meta.limit) + 1} to{" "}
                {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} tests
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Previous
                </Button>
                <span className="text-xs font-medium px-2">Page {currentPage}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage * meta.limit >= meta.total}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={Boolean(deletingTest)} onOpenChange={(open) => !open && setDeletingTest(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft Test?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingTest?.title}&quot;? This action cannot be undone. All questions and sets within this draft will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? "Deleting..." : "Delete Test"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 max-w-7xl mx-auto">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
