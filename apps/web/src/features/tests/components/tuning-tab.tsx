"use client";

import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  Eye,
  Lock,
  Phone,
  Save,
  Shield,
  ShieldAlert,
  Smartphone,
  Sliders,
  Users,
  Loader2,
  Sparkles,
} from "lucide-react";

import { toast } from "sonner";

import { useRules } from "@/features/rules/hooks/use-rules";
import { useSaveRules } from "@/features/rules/hooks/use-save-rules";
import type { UpdateRulesInput, RuleStatItem } from "@/features/rules/schemas";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface TuningTabProps {
  testId: string;
}

export function TuningTab({ testId }: TuningTabProps) {
  const { data: rulesData, isLoading, isError, error } = useRules(testId);
  const saveRulesMutation = useSaveRules(testId);

  // Form state initialized from fetched rules
  const [formData, setFormData] = useState<UpdateRulesInput | null>(null);

  useEffect(() => {
    if (rulesData) {
      setFormData({
        policy: {
          warningsEnabled: rulesData.policy.warningsEnabled,
          maxWarnings: rulesData.policy.maxWarnings,
          autoSubmitOnLimit: rulesData.policy.autoSubmitOnLimit,
        },
        rules: {
          warningCooldownSec: rulesData.rules.warningCooldownSec ?? 15,
          NO_FACE: { ...rulesData.rules.NO_FACE },
          MULTIPLE_FACES: { ...rulesData.rules.MULTIPLE_FACES },
          LOOKING_AWAY: { ...rulesData.rules.LOOKING_AWAY },
          PHONE_DETECTED: { ...rulesData.rules.PHONE_DETECTED },
          TAB_SWITCH: { ...rulesData.rules.TAB_SWITCH },
          levels: { ...rulesData.rules.levels },
        },
      });
    }
  }, [rulesData]);

  if (isLoading || !formData) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Failed to load detection rules</AlertTitle>
        <AlertDescription>{(error as any)?.message || "Could not retrieve tuning configuration."}</AlertDescription>
      </Alert>
    );
  }

  const isLocked = Boolean(rulesData?.locked);
  const stats = rulesData?.stats || {};


  const handleSave = () => {
    if (isLocked) return;

    saveRulesMutation.mutate(formData, {
      onSuccess: () => {
        toast.success("Tuning rules and warning policy updated.");
      },
      onError: (err: any) => {
        if (err?.code === "TEST_LOCKED") {
          toast.error("Test is locked. Rules cannot be modified after the test has started.");
        } else {
          toast.error(err?.message || "Failed to save tuning rules.");
        }
      },
    });
  };

  const renderStatPill = (ruleName: string) => {
    const stat: RuleStatItem | undefined = stats[ruleName];
    if (!stat) return null;

    const ratePercent = Math.round((stat.falseAlarmRate || 0) * 100);
    const reviewedCount = (stat.valid || 0) + (stat.falseAlarm || 0);

    return (
      <div className="flex flex-wrap items-center gap-3 bg-muted/40 p-2.5 rounded-lg border border-border/40 text-xs">
        <div>
          <span className="text-muted-foreground">Total:</span>{" "}
          <strong className="text-foreground">{stat.total || 0}</strong>
        </div>
        <div>
          <span className="text-muted-foreground">Valid:</span>{" "}
          <strong className="text-destructive">{stat.valid || 0}</strong>
        </div>
        <div>
          <span className="text-muted-foreground">False Alarms:</span>{" "}
          <strong className="text-emerald-600">{stat.falseAlarm || 0}</strong>
        </div>
        <div className="pl-1 border-l border-border/60">
          <span className="text-muted-foreground">False-Alarm Rate:</span>{" "}
          <Badge variant="outline" className="text-[11px] font-mono ml-1">
            {ratePercent}% ({reviewedCount} reviewed)
          </Badge>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {isLocked && (
        <Alert className="border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200">
          <Lock className="size-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="font-semibold">Tuning Locked</AlertTitle>
          <AlertDescription className="text-xs mt-1">
            Rules and policies can only be adjusted before the test start time. Since this test has started or ended, tuning is read-only.
          </AlertDescription>
        </Alert>
      )}

      {/* Warning Policy Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-primary" />
            <CardTitle className="text-lg">Warning Policy Settings</CardTitle>
          </div>
          <CardDescription>
            Configure student warning limits and cooldown timing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
            <div className="space-y-0.5">
              <span className="text-sm font-medium">Warnings Enabled</span>
              <p className="text-xs text-muted-foreground">
                Display warning badges and dialogs to students when flagged.
              </p>
            </div>
            <Switch
              disabled={isLocked}
              checked={formData.policy.warningsEnabled}
              onCheckedChange={(checked) =>
                setFormData((prev) => prev && {
                  ...prev,
                  policy: { ...prev.policy, warningsEnabled: checked },
                })
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">
                Maximum Warnings (1 - 5)
              </label>
              <Input
                type="number"
                min={1}
                max={5}
                disabled={isLocked || !formData.policy.warningsEnabled}
                value={formData.policy.maxWarnings}
                onChange={(e) =>
                  setFormData((prev) => prev && {
                    ...prev,
                    policy: { ...prev.policy, maxWarnings: Number(e.target.value) },
                  })
                }
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">
                Warning Cooldown (Seconds)
              </label>
              <Input
                type="number"
                min={5}
                max={120}
                disabled={isLocked}
                value={formData.rules.warningCooldownSec}
                onChange={(e) =>
                  setFormData((prev) => prev && {
                    ...prev,
                    rules: { ...prev.rules, warningCooldownSec: Number(e.target.value) },
                  })
                }
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Cooldown prevents repeat warnings for the same event type.
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="auto-submit"
                disabled={isLocked || !formData.policy.warningsEnabled}
                checked={formData.policy.autoSubmitOnLimit}
                onCheckedChange={(checked) =>
                  setFormData((prev) => prev && {
                    ...prev,
                    policy: { ...prev.policy, autoSubmitOnLimit: Boolean(checked) },
                  })
                }
              />
              <label
                htmlFor="auto-submit"
                className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Auto-submit exam on warning limit
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rule Cards Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Sliders className="size-4 text-primary" />
          <span>Detection Rules & Sensitivity</span>
        </h3>

        {/* 1. NO_FACE */}
        <RuleCard
          title="No Face Detected"
          description="Fires when no face is visible in the student's camera stream."
          ruleKey="NO_FACE"
          isLocked={isLocked}
          statComponent={renderStatPill("NO_FACE")}
          enabled={formData.rules.NO_FACE.enabled}
          weight={formData.rules.NO_FACE.weight}
          warn={formData.rules.NO_FACE.warn}
          onToggle={(enabled) =>
            setFormData((prev) => prev && {
              ...prev,
              rules: { ...prev.rules, NO_FACE: { ...prev.rules.NO_FACE, enabled } },
            })
          }
          onWeightChange={(weight) =>
            setFormData((prev) => prev && {
              ...prev,
              rules: { ...prev.rules, NO_FACE: { ...prev.rules.NO_FACE, weight } },
            })
          }
          onWarnChange={(warn) =>
            setFormData((prev) => prev && {
              ...prev,
              rules: { ...prev.rules, NO_FACE: { ...prev.rules.NO_FACE, warn } },
            })
          }
          extraInputs={
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Trigger After (sec)</label>
              <Input
                type="number"
                min={1}
                max={30}
                disabled={isLocked}
                value={formData.rules.NO_FACE.afterSec}
                onChange={(e) =>
                  setFormData((prev) => prev && {
                    ...prev,
                    rules: { ...prev.rules, NO_FACE: { ...prev.rules.NO_FACE, afterSec: Number(e.target.value) } },
                  })
                }
              />
            </div>
          }
        />

        {/* 2. MULTIPLE_FACES */}
        <RuleCard
          title="Multiple Faces Detected"
          description="Fires when more than one person is visible in front of the camera."
          ruleKey="MULTIPLE_FACES"
          isLocked={isLocked}
          statComponent={renderStatPill("MULTIPLE_FACES")}
          enabled={formData.rules.MULTIPLE_FACES.enabled}
          weight={formData.rules.MULTIPLE_FACES.weight}
          warn={formData.rules.MULTIPLE_FACES.warn}
          onToggle={(enabled) =>
            setFormData((prev) => prev && {
              ...prev,
              rules: { ...prev.rules, MULTIPLE_FACES: { ...prev.rules.MULTIPLE_FACES, enabled } },
            })
          }
          onWeightChange={(weight) =>
            setFormData((prev) => prev && {
              ...prev,
              rules: { ...prev.rules, MULTIPLE_FACES: { ...prev.rules.MULTIPLE_FACES, weight } },
            })
          }
          onWarnChange={(warn) =>
            setFormData((prev) => prev && {
              ...prev,
              rules: { ...prev.rules, MULTIPLE_FACES: { ...prev.rules.MULTIPLE_FACES, warn } },
            })
          }
          extraInputs={
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Trigger After (sec)</label>
              <Input
                type="number"
                min={1}
                max={30}
                disabled={isLocked}
                value={formData.rules.MULTIPLE_FACES.afterSec}
                onChange={(e) =>
                  setFormData((prev) => prev && {
                    ...prev,
                    rules: { ...prev.rules, MULTIPLE_FACES: { ...prev.rules.MULTIPLE_FACES, afterSec: Number(e.target.value) } },
                  })
                }
              />
            </div>
          }
        />

        {/* 3. LOOKING_AWAY */}
        <RuleCard
          title="Looking Away / Head Turn"
          description="Tracks head pose yaw angle away from the screen."
          ruleKey="LOOKING_AWAY"
          isLocked={isLocked}
          statComponent={renderStatPill("LOOKING_AWAY")}
          enabled={formData.rules.LOOKING_AWAY.enabled}
          weight={formData.rules.LOOKING_AWAY.weight}
          warn={formData.rules.LOOKING_AWAY.warn}
          onToggle={(enabled) =>
            setFormData((prev) => prev && {
              ...prev,
              rules: { ...prev.rules, LOOKING_AWAY: { ...prev.rules.LOOKING_AWAY, enabled } },
            })
          }
          onWeightChange={(weight) =>
            setFormData((prev) => prev && {
              ...prev,
              rules: { ...prev.rules, LOOKING_AWAY: { ...prev.rules.LOOKING_AWAY, weight } },
            })
          }
          onWarnChange={(warn) =>
            setFormData((prev) => prev && {
              ...prev,
              rules: { ...prev.rules, LOOKING_AWAY: { ...prev.rules.LOOKING_AWAY, warn } },
            })
          }
          extraInputs={
            <>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Trigger After (sec)</label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  disabled={isLocked}
                  value={formData.rules.LOOKING_AWAY.afterSec}
                  onChange={(e) =>
                    setFormData((prev) => prev && {
                      ...prev,
                      rules: { ...prev.rules, LOOKING_AWAY: { ...prev.rules.LOOKING_AWAY, afterSec: Number(e.target.value) } },
                    })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Yaw Angle Threshold (°)</label>
                <Input
                  type="number"
                  min={15}
                  max={80}
                  disabled={isLocked}
                  value={formData.rules.LOOKING_AWAY.yawDeg}
                  onChange={(e) =>
                    setFormData((prev) => prev && {
                      ...prev,
                      rules: { ...prev.rules, LOOKING_AWAY: { ...prev.rules.LOOKING_AWAY, yawDeg: Number(e.target.value) } },
                    })
                  }
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="ignore-down"
                  disabled={isLocked}
                  checked={formData.rules.LOOKING_AWAY.ignoreLookingDown}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => prev && {
                      ...prev,
                      rules: { ...prev.rules, LOOKING_AWAY: { ...prev.rules.LOOKING_AWAY, ignoreLookingDown: Boolean(checked) } },
                    })
                  }
                />
                <label htmlFor="ignore-down" className="text-xs font-medium leading-none">
                  Ignore looking down (writing paper)
                </label>
              </div>
            </>
          }
        />

        {/* 4. PHONE_DETECTED */}
        <RuleCard
          title="Phone / Device Detected"
          description="Detects mobile phones or unauthorized electronics via object recognition."
          ruleKey="PHONE_DETECTED"
          isLocked={isLocked}
          statComponent={renderStatPill("PHONE_DETECTED")}
          enabled={formData.rules.PHONE_DETECTED.enabled}
          weight={formData.rules.PHONE_DETECTED.weight}
          warn={formData.rules.PHONE_DETECTED.warn}
          onToggle={(enabled) =>
            setFormData((prev) => prev && {
              ...prev,
              rules: { ...prev.rules, PHONE_DETECTED: { ...prev.rules.PHONE_DETECTED, enabled } },
            })
          }
          onWeightChange={(weight) =>
            setFormData((prev) => prev && {
              ...prev,
              rules: { ...prev.rules, PHONE_DETECTED: { ...prev.rules.PHONE_DETECTED, weight } },
            })
          }
          onWarnChange={(warn) =>
            setFormData((prev) => prev && {
              ...prev,
              rules: { ...prev.rules, PHONE_DETECTED: { ...prev.rules.PHONE_DETECTED, warn } },
            })
          }
          extraInputs={
            <>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Min Confidence (0 - 1)</label>
                <Input
                  type="number"
                  step="0.05"
                  min={0.1}
                  max={1.0}
                  disabled={isLocked}
                  value={formData.rules.PHONE_DETECTED.minConfidence}
                  onChange={(e) =>
                    setFormData((prev) => prev && {
                      ...prev,
                      rules: { ...prev.rules, PHONE_DETECTED: { ...prev.rules.PHONE_DETECTED, minConfidence: Number(e.target.value) } },
                    })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Trigger After (sec)</label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  disabled={isLocked}
                  value={formData.rules.PHONE_DETECTED.afterSec}
                  onChange={(e) =>
                    setFormData((prev) => prev && {
                      ...prev,
                      rules: { ...prev.rules, PHONE_DETECTED: { ...prev.rules.PHONE_DETECTED, afterSec: Number(e.target.value) } },
                    })
                  }
                />
              </div>
            </>
          }
        />

        {/* 5. TAB_SWITCH */}
        <RuleCard
          title="Tab Switch / Window Blur"
          description="Triggered when the student navigates away or switches browser tabs."
          ruleKey="TAB_SWITCH"
          isLocked={isLocked}
          statComponent={renderStatPill("TAB_SWITCH")}
          enabled={formData.rules.TAB_SWITCH.enabled}
          weight={formData.rules.TAB_SWITCH.weight}
          warn={formData.rules.TAB_SWITCH.warn}
          onToggle={(enabled) =>
            setFormData((prev) => prev && {
              ...prev,
              rules: { ...prev.rules, TAB_SWITCH: { ...prev.rules.TAB_SWITCH, enabled } },
            })
          }
          onWeightChange={(weight) =>
            setFormData((prev) => prev && {
              ...prev,
              rules: { ...prev.rules, TAB_SWITCH: { ...prev.rules.TAB_SWITCH, weight } },
            })
          }
          onWarnChange={(warn) =>
            setFormData((prev) => prev && {
              ...prev,
              rules: { ...prev.rules, TAB_SWITCH: { ...prev.rules.TAB_SWITCH, warn } },
            })
          }
        />
      </div>

      {/* Risk Thresholds Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Risk Score Thresholds</CardTitle>
          <CardDescription>
            Cumulative penalty points threshold for session risk categorization.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Medium Risk Threshold (points)</label>
            <Input
              type="number"
              min={1}
              disabled={isLocked}
              value={formData.rules.levels.medium}
              onChange={(e) =>
                setFormData((prev) => prev && {
                  ...prev,
                  rules: { ...prev.rules, levels: { ...prev.rules.levels, medium: Number(e.target.value) } },
                })
              }
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">High Risk Threshold (points)</label>
            <Input
              type="number"
              min={1}
              disabled={isLocked}
              value={formData.rules.levels.high}
              onChange={(e) =>
                setFormData((prev) => prev && {
                  ...prev,
                  rules: { ...prev.rules, levels: { ...prev.rules.levels, high: Number(e.target.value) } },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      {!isLocked && (
        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSave}
            disabled={saveRulesMutation.isPending}
            className="min-w-36 shadow-sm"
          >
            {saveRulesMutation.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            Save Rule Settings
          </Button>
        </div>
      )}
    </div>
  );
}

// Reusable card for each detection rule
function RuleCard({
  title,
  description,
  ruleKey,
  isLocked,
  enabled,
  weight,
  warn,
  onToggle,
  onWeightChange,
  onWarnChange,
  extraInputs,
  statComponent,
}: {
  title: string;
  description: string;
  ruleKey: string;
  isLocked: boolean;
  enabled: boolean;
  weight: number;
  warn: boolean;
  onToggle: (enabled: boolean) => void;
  onWeightChange: (weight: number) => void;
  onWarnChange: (warn: boolean) => void;
  extraInputs?: React.ReactNode;
  statComponent?: React.ReactNode;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/40 pb-3">
          <div className="space-y-0.5">
            <span className="font-semibold text-sm text-foreground">{title}</span>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{enabled ? "Enabled" : "Disabled"}</span>
            <Switch
              disabled={isLocked}
              checked={enabled}
              onCheckedChange={onToggle}
            />
          </div>
        </div>

        {statComponent}

        {enabled && (
          <div className="grid gap-4 sm:grid-cols-3 pt-1">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Risk Weight (Points)</label>
              <Input
                type="number"
                min={0}
                max={20}
                disabled={isLocked}
                value={weight}
                onChange={(e) => onWeightChange(Number(e.target.value))}
              />
              <p className="text-[10px] text-muted-foreground mt-0.5">Points added to student risk score</p>
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id={`warn-${ruleKey}`}
                disabled={isLocked}
                checked={warn}
                onCheckedChange={(checked) => onWarnChange(Boolean(checked))}
              />
              <label htmlFor={`warn-${ruleKey}`} className="text-xs font-medium leading-none">
                Counts as warning violation
              </label>
            </div>

            {extraInputs}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
