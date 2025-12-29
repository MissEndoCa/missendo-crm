import * as React from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock } from "lucide-react";

type TimePickerProps = {
  value: string;
  onValueChange: (value: string) => void;
  stepMinutes?: 5 | 10 | 15 | 20 | 30;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function buildTimes(stepMinutes: number) {
  const times: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += stepMinutes) {
      times.push(`${pad2(h)}:${pad2(m)}`);
    }
  }
  return times;
}

export function TimePicker({
  value,
  onValueChange,
  stepMinutes = 15,
  placeholder = "Select time",
  disabled,
  className,
  contentClassName,
}: TimePickerProps) {
  const times = React.useMemo(() => buildTimes(stepMinutes), [stepMinutes]);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <span className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder={placeholder} />
        </span>
      </SelectTrigger>
      <SelectContent className={"z-50 bg-popover " + (contentClassName ?? "")}>
        {times.map((t) => (
          <SelectItem key={t} value={t}>
            {t}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
