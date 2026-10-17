"use client";

import React, { useState, useMemo } from "react";
import { format, isValid, parseISO, addDays, setHours, setMinutes } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "cn";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TestDateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function TestDateTimePicker({
  value,
  onChange,
  disabled = false,
}: TestDateTimePickerProps) {
  const [open, setOpen] = useState(false);

  const date = useMemo(() => {
    if (!value) return new Date();
    try {
      const parsed = parseISO(value);
      return isValid(parsed) ? parsed : new Date(value);
    } catch {
      return new Date();
    }
  }, [value]);

  const timeString = isValid(date) ? format(date, "HH:mm") : "10:00";

  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) return;
    const [hours, minutes] = timeString.split(":").map(Number);
    const updated = setMinutes(setHours(newDate, hours || 10), minutes || 0);
    onChange(format(updated, "yyyy-MM-dd'T'HH:mm"));
    setOpen(false);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    if (!newTime) return;
    const [hours, minutes] = newTime.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return;
    const updated = setMinutes(setHours(date, hours), minutes);
    onChange(format(updated, "yyyy-MM-dd'T'HH:mm"));
  };

  const handleQuickPreset = (daysAhead: number) => {
    const base = addDays(date, daysAhead);
    const [hours, minutes] = timeString.split(":").map(Number);
    const updated = setMinutes(setHours(base, hours || 10), minutes || 0);
    onChange(format(updated, "yyyy-MM-dd'T'HH:mm"));
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Date Trigger with Shadcn Popover & Calendar */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className={cn(
                "flex-1 justify-start text-left font-normal h-9 bg-background hover:bg-muted/50 border-input shadow-xs transition-colors",
                !value && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 size-4 text-muted-foreground" />
              <span className="font-medium text-xs text-foreground">
                {isValid(date) ? format(date, "EEE, MMM d, yyyy") : "Pick date"}
              </span>
            </Button>
          }
        />
        <PopoverContent className="w-auto p-3" align="start">
          <div className="space-y-2.5">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              autoFocus
            />
            <div className="flex items-center gap-1.5 pt-2 border-t border-border/40">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="text-xs h-6 px-2 text-muted-foreground"
                onClick={() => handleQuickPreset(0)}
              >
                Today
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="text-xs h-6 px-2 text-muted-foreground"
                onClick={() => handleQuickPreset(1)}
              >
                Tomorrow
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="text-xs h-6 px-2 text-muted-foreground"
                onClick={() => handleQuickPreset(7)}
              >
                Next week
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Time Selector */}
      <div className="relative shrink-0">
        <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          type="time"
          value={timeString}
          onChange={handleTimeChange}
          disabled={disabled}
          className="h-9 w-28 pl-8 font-mono text-xs shadow-xs"
        />
      </div>
    </div>
  );
}
