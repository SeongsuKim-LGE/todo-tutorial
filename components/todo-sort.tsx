"use client";

import type { ComponentType } from "react";
import {
  CalendarPlusIcon,
  TextAaIcon,
  CalendarCheckIcon,
} from "@phosphor-icons/react";
import { SORT_OPTIONS, type SortBy } from "@/lib/types";
import { Button } from "@/components/ui/button";

const SORT_ICONS: Record<SortBy, ComponentType<{ className?: string }>> = {
  created: CalendarPlusIcon,
  name: TextAaIcon,
  due: CalendarCheckIcon,
};

interface TodoSortProps {
  value: SortBy;
  onChange: (value: SortBy) => void;
}

export function TodoSort({ value, onChange }: TodoSortProps) {
  return (
    <div role="radiogroup" aria-label="정렬" className="flex gap-1">
      {SORT_OPTIONS.map((item) => {
        const selected = item.value === value;
        const Icon = SORT_ICONS[item.value];
        return (
          <Button
            key={item.value}
            type="button"
            size="icon-sm"
            variant={selected ? "default" : "outline"}
            role="radio"
            aria-checked={selected}
            aria-label={item.label}
            title={item.label}
            onClick={() => onChange(item.value)}
          >
            <Icon />
          </Button>
        );
      })}
    </div>
  );
}
