"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

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

interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value?: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No option found.",
  disabled,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [contentWidth, setContentWidth] = React.useState<string>("auto");

  React.useEffect(() => {
    if (open && triggerRef.current) {
      const width = triggerRef.current.offsetWidth;
      setContentWidth(`${width}px`);
    }
  }, [open]);

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
            {value
              ? options.find((option) => option.value === value)?.label
              : placeholder}
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
                    onChange(option.value === value ? undefined : option.value);
                    setOpen(false);
                  }}
                >
                  <span className="truncate">{option.label}</span>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4 shrink-0 text-slate-700",
                      value === option.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
