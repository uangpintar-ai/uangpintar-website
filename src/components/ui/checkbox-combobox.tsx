"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CheckboxComboboxOption {
  value: string;
  label: string;
}

interface CheckboxComboboxProps {
  options: CheckboxComboboxOption[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
}

export function CheckboxCombobox({
  options,
  values,
  onChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No option found.",
  disabled,
  className,
}: CheckboxComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [contentWidth, setContentWidth] = React.useState<string>("auto");

  React.useEffect(() => {
    if (open && triggerRef.current) {
      const width = triggerRef.current.offsetWidth;
      setContentWidth(`${width}px`);
    }
  }, [open]);

  const selected = options.filter((o) => values.includes(o.value));

  const toggle = (value: string) => {
    onChange(
      values.includes(value)
        ? values.filter((v) => v !== value)
        : [...values, value],
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full cursor-pointer justify-between overflow-hidden hover:bg-slate-50 hover:text-slate-900",
            className,
          )}
          disabled={disabled}
        >
          <p className="text-ellipsis line-clamp-1">
            {selected.length === 0
              ? placeholder
              : selected.length === 1
                ? selected[0]!.label
                : `${selected.length} dompet`}
          </p>
          <ChevronDown
            className={cn(
              "ml-2 h-4 w-4 shrink-0 opacity-50 duration-200",
              open && "-rotate-180",
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 z-[64]" style={{ width: contentWidth }}>
        <Command className="max-h-[70vh]">
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-[70vh]">
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  keywords={[option.value, option.label]}
                  className="cursor-pointer data-[selected=true]:bg-slate-100 data-[selected=true]:text-slate-900"
                  onSelect={() => {
                    toggle(option.value);
                  }}
                >
                  <Checkbox
                    checked={values.includes(option.value)}
                    className="data-[state=checked]:border-slate-700 data-[state=checked]:bg-slate-700 data-[state=checked]:text-white dark:data-[state=checked]:border-slate-600 dark:data-[state=checked]:bg-slate-600 dark:data-[state=checked]:text-white"
                  />
                  <span className="ml-2">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
