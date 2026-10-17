/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Loader2,
  Plus,
  Save,
  Trash2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";

import {
  testFormSchema,
  type TestFormInput,
  type TestDetail,
} from "../schemas";
import { useSaveTest } from "../hooks/use-save-test";
import {
  Card,
  CardContent,
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
import {
  FieldGroup,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { TestDateTimePicker } from "./test-date-time-picker";
import { TestCreationTimeline, type TestSectionId } from "./test-creation-timeline";

interface TestFormProps {
  initialData?: TestDetail;
  testId?: string;
  showTimeline?: boolean;
}

export function TestForm({ initialData, testId, showTimeline = true }: TestFormProps) {
  const router = useRouter();
  const isPublished = initialData?.status === "PUBLISHED";
  const saveMutation = useSaveTest(testId);
  const [activeSetIndex, setActiveSetIndex] = useState(0);

  // Active section state: only one section shown at a time
  const [activeSection, setActiveSection] = useState<TestSectionId>("test-details");

  const defaultStartsAt = initialData?.startsAt
    ? new Date(initialData.startsAt).toISOString().slice(0, 16)
    : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

  const form = useForm<TestFormInput>({
    resolver: zodResolver(testFormSchema) as any,
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      startsAt: defaultStartsAt,
      durationMinutes: initialData?.durationMinutes ?? 60,
      warningsEnabled: initialData?.warningsEnabled ?? true,
      maxWarnings: initialData?.maxWarnings ?? 2,
      autoSubmitOnLimit: initialData?.autoSubmitOnLimit ?? true,
      sets: initialData?.sets && initialData.sets.length > 0
        ? initialData.sets
        : [
            {
              name: "Set A",
              questions: [
                {
                  text: "What is the capital of France?",
                  options: ["Berlin", "Paris", "Rome", "Madrid"],
                  correctIndex: 1,
                  marks: 1,
                  order: 1,
                },
              ],
            },
          ],
    },
  });

  const {
    fields: setFields,
    append: appendSet,
    remove: removeSet,
  } = useFieldArray({
    control: form.control,
    name: "sets",
  });

  const watchedTitle = form.watch("title");
  const watchedStartsAt = form.watch("startsAt");
  const watchedWarningsEnabled = form.watch("warningsEnabled");
  const watchedSets = form.watch("sets") || [];

  const handleNextFromDetails = async () => {
    const isValid = await form.trigger(["title", "startsAt", "durationMinutes"]);
    if (isValid) {
      setActiveSection("proctoring-policy");
    } else {
      toast.error("Please enter a test title.");
    }
  };

  const handleNextFromProctoring = () => {
    setActiveSection("question-sets");
  };

  const onSubmit = async (values: TestFormInput) => {
    if (isPublished) return;

    const isoDate = new Date(values.startsAt).toISOString();
    const formattedPayload: TestFormInput = {
      ...values,
      startsAt: isoDate,
    };

    saveMutation.mutate(formattedPayload, {
      onSuccess: (response: any) => {
        toast.success(testId ? "Test updated" : "Test created");
        const targetId = testId || response?.data?.id;
        if (targetId) {
          router.push(`/tests/${targetId}`);
        } else {
          router.push("/dashboard");
        }
      },
      onError: (err: any) => {
        if (err?.code === "TEST_LOCKED") {
          toast.error("Test is locked and cannot be edited.");
        } else {
          toast.error(err?.message || "Failed to save test.");
        }
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-3xl mx-auto pb-12">
        {/* Published Alert */}
        {isPublished && (
          <Alert className="border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200 py-3">
            <AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-xs font-semibold">Test is Published (Read-Only)</AlertTitle>
            <AlertDescription className="text-xs mt-0.5">
              This test is locked and cannot be edited.
            </AlertDescription>
          </Alert>
        )}

        {/* Clean Minimal Timeline */}
        {showTimeline && (
          <TestCreationTimeline
            title={watchedTitle}
            startsAt={watchedStartsAt}
            warningsEnabled={watchedWarningsEnabled}
            sets={watchedSets}
            activeSection={activeSection}
            onSectionClick={setActiveSection}
          />
        )}

        {/* SECTION 1: Test Details */}
        {activeSection === "test-details" && (
          <Card className="border-border/70 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-semibold">Test Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <FieldSet className="gap-4">
                <FieldGroup className="gap-4">
                  {/* Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-medium">Title</FormLabel>
                        <FormControl>
                          <Input
                            disabled={isPublished}
                            placeholder="e.g. Midterm Examination"
                            className="h-9 text-xs font-medium shadow-xs"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-medium">Instructions (optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            disabled={isPublished}
                            rows={2}
                            placeholder="Add brief instructions for students..."
                            className="resize-none text-xs shadow-xs"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Schedule & Duration */}
                  <div className="grid gap-4 sm:grid-cols-2 pt-1">
                    <FormField
                      control={form.control}
                      name="startsAt"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-xs font-medium">Starts At</FormLabel>
                          <FormControl>
                            <TestDateTimePicker
                              value={field.value}
                              onChange={field.onChange}
                              disabled={isPublished}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="durationMinutes"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-xs font-medium">Duration</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-1.5">
                              <Input
                                type="number"
                                min={5}
                                max={480}
                                disabled={isPublished}
                                className="h-9 w-24 text-xs font-mono shadow-xs"
                                {...field}
                              />
                              <span className="text-xs text-muted-foreground mr-1">mins</span>
                              {!isPublished && (
                                <div className="flex items-center gap-1">
                                  {[30, 60, 90].map((mins) => (
                                    <button
                                      key={mins}
                                      type="button"
                                      onClick={() => field.onChange(mins)}
                                      className={cn(
                                        "text-[11px] px-2 py-1 rounded border transition-colors cursor-pointer",
                                        Number(field.value) === mins
                                          ? "border-foreground bg-foreground text-background font-medium"
                                          : "border-border/60 hover:bg-muted text-muted-foreground"
                                      )}
                                    >
                                      {mins}m
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </FieldGroup>
              </FieldSet>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-border/40">
                <Link
                  href={testId ? `/tests/${testId}` : "/dashboard"}
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-xs text-muted-foreground")}
                >
                  Cancel
                </Link>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleNextFromDetails}
                  className="text-xs h-8 shadow-xs cursor-pointer"
                >
                  Next: Proctoring
                  <ArrowRight className="ml-1.5 size-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SECTION 2: Proctoring Policy */}
        {activeSection === "proctoring-policy" && (
          <Card className="border-border/70 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-semibold">Proctoring Rules</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <FieldSet className="gap-4">
                <FieldGroup className="gap-4">
                  {/* Warning Switch */}
                  <FormField
                    control={form.control}
                    name="warningsEnabled"
                    render={({ field }) => (
                      <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                        <div>
                          <span className="text-xs font-medium text-foreground">
                            AI Violation Warnings
                          </span>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Detects looking away, missing face, multiple faces, and phones.
                          </p>
                        </div>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isPublished}
                        />
                      </div>
                    )}
                  />

                  {/* Warning limit settings */}
                  {form.watch("warningsEnabled") && (
                    <div className="grid gap-3 sm:grid-cols-2 pt-1">
                      <FormField
                        control={form.control}
                        name="maxWarnings"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <FormLabel className="text-xs font-medium">Warning Limit</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-1.5">
                                {[1, 2, 3, 4, 5].map((count) => (
                                  <button
                                    key={count}
                                    type="button"
                                    onClick={() => field.onChange(count)}
                                    className={cn(
                                      "size-7 rounded text-xs border transition-colors flex items-center justify-center cursor-pointer",
                                      Number(field.value) === count
                                        ? "border-foreground bg-foreground text-background font-semibold"
                                        : "border-border/60 hover:bg-muted text-muted-foreground"
                                    )}
                                  >
                                    {count}
                                  </button>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="autoSubmitOnLimit"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2.5 space-y-0 rounded-lg border border-border/60 p-3 self-end">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isPublished}
                              />
                            </FormControl>
                            <FormLabel className="text-xs font-normal cursor-pointer leading-tight">
                              Auto-submit exam when warning limit reached
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </FieldGroup>
              </FieldSet>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-border/40">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveSection("test-details")}
                  className="text-xs h-8 cursor-pointer"
                >
                  <ArrowLeft className="mr-1.5 size-3.5" />
                  Back
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleNextFromProctoring}
                  className="text-xs h-8 shadow-xs cursor-pointer"
                >
                  Next: Questions
                  <ArrowRight className="ml-1.5 size-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SECTION 3: Question Sets & MCQs */}
        {activeSection === "question-sets" && (
          <Card className="border-border/70 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Questions & Sets</CardTitle>
                {!isPublished && (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    className="h-7 text-xs shadow-xs cursor-pointer"
                    onClick={() => {
                      const newIndex = setFields.length;
                      appendSet({
                        name: `Set ${String.fromCharCode(65 + newIndex)}`,
                        questions: [
                          {
                            text: "",
                            options: ["Option 1", "Option 2", "Option 3", "Option 4"],
                            correctIndex: 0,
                            marks: 1,
                            order: 1,
                          },
                        ],
                      });
                      setActiveSetIndex(newIndex);
                    }}
                  >
                    <Plus className="mr-1 size-3" />
                    Add Set
                  </Button>
                )}
              </div>

              {/* Set Tabs */}
              <div className="flex items-center gap-1.5 pt-2">
                {setFields.map((setField, sIndex) => {
                  const isActive = activeSetIndex === sIndex;
                  const setName = watchedSets[sIndex]?.name || `Set ${sIndex + 1}`;
                  const qCount = watchedSets[sIndex]?.questions?.length || 0;

                  return (
                    <button
                      key={setField.id}
                      type="button"
                      onClick={() => setActiveSetIndex(sIndex)}
                      className={cn(
                        "px-2.5 py-1 rounded text-xs transition-all flex items-center gap-1 border cursor-pointer",
                        isActive
                          ? "bg-foreground text-background border-foreground font-medium"
                          : "bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted"
                      )}
                    >
                      <span>{setName}</span>
                      <span className="text-[10px] opacity-70">({qCount})</span>
                    </button>
                  );
                })}
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {setFields.map((setField, sIndex) => {
                if (sIndex !== activeSetIndex) return null;

                return (
                  <div key={setField.id} className="space-y-4">
                    {/* Inline Set Toolbar */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FormField
                          control={form.control as any}
                          name={`sets.${sIndex}.name`}
                          render={({ field }) => (
                            <Input
                              disabled={isPublished}
                              placeholder="Set Name"
                              className="h-7 w-24 text-xs font-medium shadow-xs"
                              {...field}
                            />
                          )}
                        />
                      </div>

                      {!isPublished && setFields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          className="text-destructive hover:bg-destructive/10 h-7 text-xs cursor-pointer"
                          onClick={() => {
                            removeSet(sIndex);
                            setActiveSetIndex(Math.max(0, sIndex - 1));
                          }}
                        >
                          <Trash2 className="size-3 mr-1" />
                          Delete Set
                        </Button>
                      )}
                    </div>

                    {/* Questions */}
                    <CompactQuestionsList
                      control={form.control as any}
                      setIndex={sIndex}
                      isPublished={isPublished}
                    />
                  </div>
                );
              })}

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-border/40">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveSection("proctoring-policy")}
                  className="text-xs h-8 cursor-pointer"
                >
                  <ArrowLeft className="mr-1.5 size-3.5" />
                  Back
                </Button>

                {!isPublished && (
                  <Button
                    type="submit"
                    size="sm"
                    disabled={saveMutation.isPending}
                    className="min-w-28 shadow-sm text-xs font-medium h-8 cursor-pointer"
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    ) : (
                      <Save className="mr-1.5 size-3.5" />
                    )}
                    {testId ? "Save Changes" : "Create Test"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </Form>
  );
}

// Subcomponent: Minimal Questions List
function CompactQuestionsList({
  control,
  setIndex,
  isPublished,
}: {
  control: any;
  setIndex: number;
  isPublished: boolean;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `sets.${setIndex}.questions`,
  });

  return (
    <div className="space-y-3">
      {fields.map((questionField, qIndex) => (
        <div
          key={questionField.id}
          className="rounded-lg border border-border/70 p-3 space-y-2.5 bg-background shadow-2xs"
        >
          {/* Question Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-muted-foreground">
                Q{qIndex + 1}
              </span>
              <FormField
                control={control}
                name={`sets.${setIndex}.questions.${qIndex}.marks`}
                render={({ field }) => (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Input
                      type="number"
                      min={1}
                      disabled={isPublished}
                      className="w-12 h-6 text-xs text-center font-mono p-0 shadow-xs"
                      {...field}
                    />
                    <span>pt</span>
                  </div>
                )}
              />
            </div>

            {!isPublished && fields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground hover:text-destructive cursor-pointer"
                onClick={() => remove(qIndex)}
              >
                <Trash2 className="size-3" />
                <span className="sr-only">Delete</span>
              </Button>
            )}
          </div>

          {/* Question Prompt */}
          <FormField
            control={control}
            name={`sets.${setIndex}.questions.${qIndex}.text`}
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                  <Input
                    disabled={isPublished}
                    placeholder="Enter question..."
                    className="h-8 text-xs font-medium shadow-xs"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Options */}
          <CompactQuestionOptions
            control={control}
            setIndex={setIndex}
            questionIndex={qIndex}
            isPublished={isPublished}
          />
        </div>
      ))}

      {!isPublished && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full border-dashed text-xs text-muted-foreground hover:text-foreground h-8 shadow-xs cursor-pointer"
          onClick={() =>
            append({
              text: "",
              options: ["Option 1", "Option 2", "Option 3", "Option 4"],
              correctIndex: 0,
              marks: 1,
              order: fields.length + 1,
            })
          }
        >
          <Plus className="mr-1 size-3 text-muted-foreground" />
          Add Question
        </Button>
      )}
    </div>
  );
}

// Subcomponent: Minimal Options
function CompactQuestionOptions({
  control,
  setIndex,
  questionIndex,
  isPublished,
}: {
  control: any;
  setIndex: number;
  questionIndex: number;
  isPublished: boolean;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `sets.${setIndex}.questions.${questionIndex}.options`,
  });

  return (
    <div className="space-y-1.5 pt-1">
      <Controller
        control={control}
        name={`sets.${setIndex}.questions.${questionIndex}.correctIndex`}
        render={({ field: correctField }) => (
          <div className="grid gap-1.5">
            {fields.map((optionItem, optIndex) => {
              const isCorrect = Number(correctField.value) === optIndex;
              const optionLetter = String.fromCharCode(65 + optIndex);

              return (
                <div
                  key={optionItem.id}
                  className={cn(
                    "flex items-center gap-1.5 rounded border px-2 py-1 transition-colors",
                    isCorrect
                      ? "border-foreground/80 bg-muted/40"
                      : "border-border/40 hover:border-border/80"
                  )}
                >
                  <input
                    type="radio"
                    name={`correct-${setIndex}-${questionIndex}`}
                    disabled={isPublished}
                    checked={isCorrect}
                    onChange={() => correctField.onChange(optIndex)}
                    className="size-3 accent-foreground cursor-pointer"
                    title={`Mark ${optionLetter} as correct`}
                  />

                  <span className="text-[10px] font-semibold text-muted-foreground w-3 text-center">
                    {optionLetter}
                  </span>

                  <Controller
                    control={control}
                    name={`sets.${setIndex}.questions.${questionIndex}.options.${optIndex}`}
                    render={({ field: optField, fieldState }) => (
                      <div className="flex-1">
                        <Input
                          disabled={isPublished}
                          placeholder={`Option ${optionLetter}`}
                          className="h-6 text-xs border-0 bg-transparent shadow-none px-1 focus-visible:ring-0"
                          {...optField}
                          value={optField.value || ""}
                        />
                        {fieldState.error && (
                          <p className="text-[10px] text-destructive">
                            {fieldState.error.message}
                          </p>
                        )}
                      </div>
                    )}
                  />

                  {!isPublished && fields.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-5 text-muted-foreground hover:text-destructive cursor-pointer"
                      onClick={() => {
                        remove(optIndex);
                        if (Number(correctField.value) >= optIndex && Number(correctField.value) > 0) {
                          correctField.onChange(Number(correctField.value) - 1);
                        }
                      }}
                    >
                      <Trash2 className="size-2.5" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      />

      {!isPublished && fields.length < 6 && (
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className="text-[11px] h-5 px-1 text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={() => append(`Option ${fields.length + 1}`)}
        >
          <Plus className="mr-1 size-2.5" />
          Add option
        </Button>
      )}
    </div>
  );
}
