"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import {
  AlertCircle,
  CheckCircle2,
  FileUp,
  HelpCircle,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  Upload,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { useParticipants } from "@/features/participants/hooks/use-participants";
import { useAddParticipants } from "@/features/participants/hooks/use-add-participants";
import { useSendCredentials } from "@/features/participants/hooks/use-send-credentials";
import { useResendCredentials } from "@/features/participants/hooks/use-resend";
import { deleteParticipantApi } from "@/features/participants/api";
import { publishTestApi } from "@/features/tests/api";
import { participantKeys } from "@/features/participants/keys";
import { testKeys } from "@/features/tests/keys";
import type { TestDetail } from "@/features/tests/schemas";
import type { ParticipantItem } from "@/features/participants/schemas";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface StudentsTabProps {
  test: TestDetail;
}

export function StudentsTab({ test }: StudentsTabProps) {
  const queryClient = useQueryClient();
  const testId = test.id;
  const isPublished = test.status === "PUBLISHED";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Queries & Mutations
  const { data: response, isLoading, refetch } = useParticipants(testId, {
    search: search.trim() || undefined,
    page,
    limit: 15,
  });

  const addParticipantsMutation = useAddParticipants(testId);
  const sendCredentialsMutation = useSendCredentials(testId);
  const resendMutation = useResendCredentials(testId);

  // Dialog & Modal states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [parsedStudents, setParsedStudents] = useState<Array<{ name: string; email: string; valid: boolean; error?: string }>>([]);

  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishErrorDetails, setPublishErrorDetails] = useState<string[] | null>(null);

  const [deletingParticipant, setDeletingParticipant] = useState<ParticipantItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const participants = response?.data || [];
  const meta = response?.meta;

  // Handle parsing paste / CSV
  const handleParseInput = (rawText: string) => {
    setPasteText(rawText);
    const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const parsed = lines.slice(0, 500).map((line) => {
      // Split by comma or tab or semicolon
      const parts = line.split(/[,;\t]+/).map((p) => p.trim());
      const name = parts[0] || "";
      const email = parts[1] || "";

      let valid = true;
      let error = undefined;

      if (!name) {
        valid = false;
        error = "Name is missing";
      } else if (!email || !emailRegex.test(email)) {
        valid = false;
        error = "Invalid email format";
      }

      return { name, email, valid, error };
    });

    setParsedStudents(parsed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleParseInput(text);
    };
    reader.readAsText(file);
  };

  const handleAddSubmit = async () => {
    const validStudents = parsedStudents
      .filter((s) => s.valid)
      .map(({ name, email }) => ({ name, email }));

    if (validStudents.length === 0) {
      toast.error("No valid students to import.");
      return;
    }

    addParticipantsMutation.mutate(
      { students: validStudents },
      {
        onSuccess: (res: any) => {
          const created = res?.data?.created ?? validStudents.length;
          const skipped = res?.data?.skipped?.length ?? 0;
          toast.success(`Imported ${created} student(s). ${skipped > 0 ? `${skipped} duplicates skipped.` : ""}`);
          setIsAddDialogOpen(false);
          setPasteText("");
          setParsedStudents([]);
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to add participants.");
        },
      }
    );
  };

  // Publish flow with NOT_READY checklist
  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishErrorDetails(null);
    try {
      await publishTestApi(testId);
      toast.success("Test published successfully! You can now send credentials to students.");
      queryClient.invalidateQueries({ queryKey: testKeys.detail(testId) });
      queryClient.invalidateQueries({ queryKey: testKeys.all });
      setPublishDialogOpen(false);
    } catch (err: any) {
      if (err?.code === "NOT_READY" && err?.details) {
        setPublishErrorDetails(
          Array.isArray(err.details) ? err.details : [String(err.details)]
        );
      } else {
        toast.error(err?.message || "Failed to publish test.");
        setPublishDialogOpen(false);
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteParticipant = async () => {
    if (!deletingParticipant) return;
    setIsDeleting(true);
    try {
      await deleteParticipantApi(testId, deletingParticipant.id);
      toast.success(`Removed ${deletingParticipant.name}`);
      queryClient.invalidateQueries({ queryKey: participantKeys.list(testId) });
      queryClient.invalidateQueries({ queryKey: testKeys.detail(testId) });
      setDeletingParticipant(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete student.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search by student name or email..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Add Students Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger render={<Button size="sm" variant="outline" className="gap-1.5" />}>
              <UserPlus className="size-4" />
              <span>Add Students</span>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Import Students</DialogTitle>
                <DialogDescription>
                  Paste names and emails (e.g. <code>John Doe, john@example.com</code> per line) or upload a CSV. Maximum 500 per batch. Sets are assigned round-robin.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 overflow-y-auto py-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Input Data
                  </span>
                  <label className="cursor-pointer text-xs font-medium text-primary hover:underline flex items-center gap-1">
                    <Upload className="size-3.5" />
                    <span>Upload CSV file</span>
                    <input
                      type="file"
                      accept=".csv,.txt"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>

                <Textarea
                  rows={5}
                  placeholder={`Alice Walker, alice@university.edu\nBob Smith, bob@university.edu`}
                  value={pasteText}
                  onChange={(e) => handleParseInput(e.target.value)}
                  className="font-mono text-xs"
                />

                {parsedStudents.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">
                        Preview: {parsedStudents.filter((s) => s.valid).length} valid of {parsedStudents.length} entries
                      </span>
                      {parsedStudents.some((s) => !s.valid) && (
                        <span className="text-destructive font-medium">
                          {parsedStudents.filter((s) => !s.valid).length} invalid rows will be ignored
                        </span>
                      )}
                    </div>

                    <div className="border border-border/60 rounded-md max-h-48 overflow-y-auto text-xs">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/40">
                            <TableHead className="py-1.5">Name</TableHead>
                            <TableHead className="py-1.5">Email</TableHead>
                            <TableHead className="py-1.5 w-24">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedStudents.slice(0, 100).map((s, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="py-1.5 font-medium">{s.name || "-"}</TableCell>
                              <TableCell className="py-1.5 font-mono">{s.email || "-"}</TableCell>
                              <TableCell className="py-1.5">
                                {s.valid ? (
                                  <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                                    Valid
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="text-[10px]">
                                    {s.error}
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddSubmit}
                  disabled={addParticipantsMutation.isPending || parsedStudents.filter((s) => s.valid).length === 0}
                >
                  {addParticipantsMutation.isPending && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  Import {parsedStudents.filter((s) => s.valid).length} Student(s)
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Send Credentials Button */}
          <Button
            size="sm"
            variant="outline"
            disabled={!isPublished || sendCredentialsMutation.isPending || participants.length === 0}
            onClick={() => {
              sendCredentialsMutation.mutate(undefined, {
                onSuccess: (res: any) => {
                  toast.success(`Credentials dispatched: ${res?.data?.sent ?? 0} sent, ${res?.data?.failed ?? 0} failed.`);
                },
                onError: (err: any) => {
                  toast.error(err?.message || "Failed to send credentials.");
                },
              });
            }}
            className="gap-1.5"
            title={!isPublished ? "Test must be published before sending credentials" : undefined}
          >
            {sendCredentialsMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            <span>Send Credentials</span>
          </Button>

          {/* Publish Test Button */}
          {!isPublished && (
            <Button
              size="sm"
              onClick={() => setPublishDialogOpen(true)}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 className="size-4" />
              <span>Publish Test</span>
            </Button>
          )}
        </div>
      </div>

      {/* Participants Table */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : participants.length === 0 ? (
        <div className="border border-dashed border-border/80 rounded-lg p-12 text-center bg-muted/5 space-y-3">
          <Users className="size-10 text-muted-foreground mx-auto" />
          <h3 className="font-semibold text-base">No students enrolled yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Add student names and email addresses to enroll them in this test and generate login credentials.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddDialogOpen(true)}
            className="mt-2"
          >
            Add first batch of students
          </Button>
        </div>
      ) : (
        <div className="border border-border/60 rounded-lg overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="font-semibold text-foreground">Student Name</TableHead>
                <TableHead className="font-semibold text-foreground">Email</TableHead>
                <TableHead className="font-semibold text-foreground">Assigned Set</TableHead>
                <TableHead className="font-semibold text-foreground">Credentials Status</TableHead>
                <TableHead className="w-[140px] text-right font-semibold text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.map((student) => {
                return (
                  <TableRow key={student.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium text-foreground py-3">
                      {student.name}
                    </TableCell>

                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {student.email}
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="font-medium text-xs">
                        {student.set?.name || "Set A"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {student.emailError ? (
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="inline-flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded border border-destructive/20 cursor-help">
                              <XCircle className="size-3" />
                              <span>Failed to email</span>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs max-w-xs">{student.emailError}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : student.credentialsSentAt ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle2 className="size-3" />
                          <span>Sent {format(new Date(student.credentialsSentAt), "MMM d, h:mm a")}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/40">
                          <span>Not sent yet</span>
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-primary"
                                disabled={resendMutation.isPending}
                                onClick={() => {
                                  resendMutation.mutate(student.id, {
                                    onSuccess: () => {
                                      toast.success(`Resent credentials to ${student.email}`);
                                    },
                                    onError: (err: any) => {
                                      toast.error(err?.message || "Failed to resend.");
                                    },
                                  });
                                }}
                              >
                                <RefreshCw className="size-3.5" />
                              </Button>
                            }
                          />
                          <TooltipContent>Resend credentials email</TooltipContent>
                        </Tooltip>

                        {!isPublished && (
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => setDeletingParticipant(student)}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              }
                            />
                            <TooltipContent>Remove student</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          {meta && meta.total > meta.limit && (
            <div className="flex items-center justify-between border-t border-border/40 px-6 py-3.5 bg-muted/5">
              <span className="text-xs text-muted-foreground">
                Showing {((meta.page - 1) * meta.limit) + 1} to{" "}
                {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} students
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-xs font-medium px-2">Page {page}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * meta.limit >= meta.total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Publish Confirmation & NOT_READY checklist Dialog */}
      <AlertDialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Assessment</AlertDialogTitle>
            <AlertDialogDescription>
              Publishing will lock questions against further edits and enable student credential distribution.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {publishErrorDetails && (
            <Alert variant="destructive" className="my-2">
              <AlertCircle className="size-4" />
              <AlertTitle className="text-sm font-semibold">Publish Checklist Failed</AlertTitle>
              <AlertDescription className="text-xs mt-1 space-y-1">
                <p>The following requirements must be resolved before publishing:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 font-medium">
                  {publishErrorDetails.map((detail, idx) => (
                    <li key={idx}>{detail}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPublishing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handlePublish();
              }}
              disabled={isPublishing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                "Confirm & Publish"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Student Dialog */}
      <AlertDialog open={Boolean(deletingParticipant)} onOpenChange={(open) => !open && setDeletingParticipant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &quot;{deletingParticipant?.name}&quot; ({deletingParticipant?.email})? Their generated password will be invalidated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteParticipant();
              }}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? "Removing..." : "Remove Student"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
