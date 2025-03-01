"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  addDays,
  addMonths,
  addWeeks,
  format,
  isAfter,
  isBefore,
} from "date-fns";

import { Icons } from "./icons";

interface ResumeDatePickerProps {
  value: Date;
  onChange?: (date: Date) => void;
}

export function ResumeDatePicker({ value, onChange }: ResumeDatePickerProps) {
  const [open, setOpen] = useState(false);

  // Calculate dates
  const today = new Date();
  const maxDate = addMonths(today, 3);

  // Preset options
  const presets = [
    { label: "1 Week", value: addWeeks(today, 1) },
    { label: "2 Weeks", value: addWeeks(today, 2) },
    { label: "1 Month", value: addMonths(today, 1) },
    { label: "3 Months", value: addMonths(today, 3) },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <Icons.calendar className="mr-2 size-4" />
          {value ? format(value, "PPP") : "Select resume date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex gap-2 p-3">
          <div className="flex flex-col gap-1 border-r pr-3">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                size="sm"
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  onChange?.(preset.value);
                  setOpen(false);
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            <Calendar
              mode="single"
              selected={value}
              onSelect={(date) => {
                if (date) {
                  onChange?.(date);
                  setOpen(false);
                }
              }}
              disabled={(date) =>
                isBefore(date, addDays(today, 1)) || isAfter(date, maxDate)
              }
              initialFocus
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
