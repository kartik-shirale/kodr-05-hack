"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Copy,
  FileQuestion,
  HelpCircle,
  Layers,
  Loader2,
  Plus,
  Radio,
  Save,
  ShieldAlert,
  Trash2,
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface TestFormProps {
  initialData?: TestDetail;
  testId?: string;
}

export function TestForm({ initialData, testId }: TestFormProps) {
  const router = useRouter();
  const isPublished = initialData?.status === "PUBLISHED";
  const saveMutation = useSaveTest(testId);

  // Format startsAt for datetime-local input
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

  const onSubmit = async (values: TestFormInput) => {
    if (isPublished) return;

    // Convert local datetime to ISO UTC format
    const isoDate = new Date(values.startsAt).toISOString();
    const formattedPayload: TestFormInput = {
      ...values,
      startsAt: isoDate,
    };

    saveMutation.mutate(formattedPayload, {
      onSuccess: (response: any) => {
        toast.success(testId ? "Test updated successfully!" : "Test created successfully!");
        const targetId = testId || response?.data?.id;
        if (targetId) {
          router.push(`/tests/${targetId}`);
        } else {
          router.push("/dashboard");
        }
      },
      onError: (err: any) => {
        if (err?.code === "TEST_LOCKED") {
          toast.error("This test is locked and cannot be edited.");
        } else {
          toast.error(err?.message || "Failed to save test. Please check all fields.");
        }
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-24 max-w-5xl mx-auto">
        {isPublished && (
          <Alert className="border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200">
            <AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="font-semibold">Test is Published (Read-Only)</AlertTitle>
            <AlertDescription className="text-xs mt-1">
              This test has been published and cannot be modified. You can view participants, live sessions, and proctoring stats from the test management tabs.
            </AlertDescription>
          </Alert>
        )}

        {/* 1. Test Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-primary" />
              <CardTitle className="text-lg">Test Details & Schedule</CardTitle>
            </div>
            <CardDescription>
              Basic information, start schedule, and duration for students.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Test Title</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isPublished}
                      placeholder="e.g. CS101: Midterm Examination"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Description / Instructions (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      disabled={isPublished}
                      rows={3}
                      placeholder="e.g. Covers Chapters 1 to 4. Ensure stable internet and webcam."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startsAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starts At (Local Time)</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      disabled={isPublished}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>The date and time when students can begin taking the test.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="durationMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (Minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={5}
                      max={480}
                      disabled={isPublished}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>5 to 480 minutes (8 hours maximum).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 2. Warning & Proctoring Policy */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-primary" />
              <CardTitle className="text-lg">Proctoring Warning Policy</CardTitle>
            </div>
            <CardDescription>
              Configure automated proctoring alerts and termination rules.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="warningsEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base font-medium">Enable Warnings</FormLabel>
                    <FormDescription>
                      When enabled, proctoring violations (e.g. multiple faces, phones) count as warnings for students.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPublished}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch("warningsEnabled") && (
              <div className="grid gap-6 md:grid-cols-2 pt-2">
                <FormField
                  control={form.control}
                  name="maxWarnings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Allowed Warnings</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={5}
                          disabled={isPublished}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Between 1 and 5 warnings before enforcement action.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="autoSubmitOnLimit"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-border/50 p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isPublished}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Auto-Submit on Warning Limit</FormLabel>
                        <FormDescription>
                          Immediately terminate and auto-submit the exam if the student exceeds the warning limit.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. Question Sets & MCQs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="size-5 text-primary" />
                <CardTitle className="text-lg">Question Sets & MCQ Editor</CardTitle>
              </div>
              <CardDescription>
                Create multiple sets for round-robin assignment to prevent cheating.
              </CardDescription>
            </div>
            {!isPublished && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendSet({
                    name: `Set ${String.fromCharCode(65 + setFields.length)}`,
                    questions: [
                      {
                        text: "",
                        options: ["", ""],
                        correctIndex: 0,
                        marks: 1,
                        order: 1,
                      },
                    ],
                  })
                }
              >
                <Plus className="mr-1.5 size-4" />
                Add Question Set
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <Accordion defaultValue={setFields.map((_, i) => `set-${i}`)} className="space-y-4">
              {setFields.map((setField, setIndex) => (
                <AccordionItem
                  key={setField.id}
                  value={`set-${setIndex}`}
                  className="border border-border/60 rounded-lg px-4"
                >
                  <div className="flex items-center justify-between py-2">
                    <AccordionTrigger className="hover:no-underline font-semibold flex-1">
                      <div className="flex items-center gap-3">
                        <span>{form.watch(`sets.${setIndex}.name`) || `Set ${setIndex + 1}`}</span>
                        <Badge variant="secondary" className="text-xs">
                          {form.watch(`sets.${setIndex}.questions`)?.length || 0} Questions
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    {!isPublished && setFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 mr-2 size-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSet(setIndex);
                        }}
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Delete Set</span>
                      </Button>
                    )}
                  </div>

                  <AccordionContent className="pt-2 pb-6 space-y-6">
                    <FormField
                      control={form.control as any}
                      name={`sets.${setIndex}.name`}
                      render={({ field }) => (
                        <FormItem className="max-w-xs">
                          <FormLabel>Set Identifier</FormLabel>
                          <FormControl>
                            <Input disabled={isPublished} placeholder="e.g. Set A" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Question List for this Set */}
                    <QuestionsList
                      control={form.control as any}
                      setIndex={setIndex}
                      isPublished={isPublished}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>

        </Card>

        {/* Sticky Save Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur px-8 py-3.5 shadow-md flex items-center justify-between">
          <Link
            href={testId ? `/tests/${testId}` : "/dashboard"}
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            Cancel
          </Link>
          {!isPublished && (
            <Button type="submit" disabled={saveMutation.isPending} className="min-w-32 shadow-sm">
              {saveMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Save className="mr-2 size-4" />
              )}
              {testId ? "Save Changes" : "Create Test"}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}

// Subcomponent for Questions inside a Set
function QuestionsList({
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
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between border-b border-border/40 pb-2">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <FileQuestion className="size-4 text-primary" />
          <span>Questions in this Set</span>
        </h4>
        {!isPublished && (
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() =>
              append({
                text: "",
                options: ["", "", "", ""],
                correctIndex: 0,
                marks: 1,
                order: fields.length + 1,
              })
            }
          >
            <Plus className="mr-1 size-3" />
            Add Question
          </Button>
        )}
      </div>

      {fields.map((questionField, qIndex) => (
        <Card key={questionField.id} className="border border-border/40 bg-muted/10">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs tracking-wider uppercase text-muted-foreground">
                Question {qIndex + 1}
              </span>
              {!isPublished && fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 text-destructive hover:bg-destructive/10"
                  onClick={() => remove(qIndex)}
                >
                  <Trash2 className="size-3.5" />
                  <span className="sr-only">Remove Question</span>
                </Button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <FormField
                control={control}
                name={`sets.${setIndex}.questions.${qIndex}.text`}
                render={({ field }) => (
                  <FormItem className="md:col-span-3">
                    <FormLabel>Question Text</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isPublished}
                        placeholder="Enter the question prompt..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`sets.${setIndex}.questions.${qIndex}.marks`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marks</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        disabled={isPublished}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Options with Radio to select correct answer */}
            <QuestionOptions
              control={control}
              setIndex={setIndex}
              questionIndex={qIndex}
              isPublished={isPublished}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Subcomponent for Question Options
function QuestionOptions({
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
    <div className="space-y-2.5 pt-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">
          Options (Select the correct option with radio):
        </label>
        {!isPublished && fields.length < 6 && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="text-xs h-6 text-primary"
            onClick={() => append("")}
          >
            <Plus className="mr-1 size-3" />
            Add Option
          </Button>
        )}
      </div>

      <Controller
        control={control}
        name={`sets.${setIndex}.questions.${questionIndex}.correctIndex`}
        render={({ field: correctField }) => (
          <div className="space-y-2">
            {fields.map((optionItem, optIndex) => (
              <div key={optionItem.id} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${setIndex}-${questionIndex}`}
                  disabled={isPublished}
                  checked={Number(correctField.value) === optIndex}
                  onChange={() => correctField.onChange(optIndex)}
                  className="size-4 text-primary focus:ring-primary cursor-pointer"
                  title="Mark as correct answer"
                />

                <Controller
                  control={control}
                  name={`sets.${setIndex}.questions.${questionIndex}.options.${optIndex}`}
                  render={({ field: optField, fieldState }) => (
                    <div className="flex-1">
                      <Input
                        disabled={isPublished}
                        placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                        className={cn(
                          Number(correctField.value) === optIndex &&
                            "border-primary/50 bg-primary/5 font-medium"
                        )}
                        {...optField}
                        value={optField.value || ""}
                      />
                      {fieldState.error && (
                        <p className="text-xs text-destructive mt-1">
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
                    className="size-8 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      remove(optIndex);
                      if (Number(correctField.value) >= optIndex && Number(correctField.value) > 0) {
                        correctField.onChange(Number(correctField.value) - 1);
                      }
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      />
    </div>
  );
}
