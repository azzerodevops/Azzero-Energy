"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
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
import { getNaceCodes, type NaceCodeRow } from "@/actions/sites";
import { NACE_SECTION_LABELS } from "@azzeroco2/shared";

interface NaceSelectorProps {
  value: string;
  onSelect: (code: string, sectorLabel: string) => void;
}

/**
 * A searchable combobox for selecting NACE codes.
 * Fetches codes from the database, groups them by section,
 * and auto-fills the sector field on selection.
 */
export function NaceSelector({ value, onSelect }: NaceSelectorProps) {
  const [open, setOpen] = useState(false);
  const [naceCodes, setNaceCodes] = useState<NaceCodeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchCodes = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const result = await getNaceCodes();
      if (result.success) {
        setNaceCodes(result.data);
      }
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [loaded]);

  // Fetch codes when the popover first opens
  useEffect(() => {
    if (open && !loaded) {
      fetchCodes();
    }
  }, [open, loaded, fetchCodes]);

  // Group codes by section
  const groupedCodes = naceCodes.reduce<Record<string, NaceCodeRow[]>>(
    (acc, code) => {
      const section = code.section;
      if (!acc[section]) {
        acc[section] = [];
      }
      acc[section].push(code);
      return acc;
    },
    {},
  );

  // Sorted section keys
  const sections = Object.keys(groupedCodes).sort();

  // Find the currently selected code's display label
  const selectedCode = naceCodes.find((c) => c.code === value);
  const displayLabel = selectedCode
    ? `${selectedCode.code} - ${selectedCode.description}`
    : value || "Seleziona codice NACE...";

  function handleSelect(code: string) {
    const match = naceCodes.find((c) => c.code === code);
    const sectorLabel = match
      ? NACE_SECTION_LABELS[match.section] ?? match.section
      : "";
    onSelect(code, sectorLabel);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {displayLabel}
          </span>
          {loading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        sideOffset={4}
      >
        <Command>
          <CommandInput placeholder="Cerca codice o descrizione..." />
          <CommandList>
            <CommandEmpty>
              {loading ? "Caricamento..." : "Nessun codice trovato"}
            </CommandEmpty>
            {sections.map((section) => (
              <CommandGroup
                key={section}
                heading={`${section} - ${NACE_SECTION_LABELS[section] ?? section}`}
              >
                {groupedCodes[section].map((nace) => (
                  <CommandItem
                    key={nace.code}
                    value={`${nace.code} ${nace.description}`}
                    onSelect={() => handleSelect(nace.code)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === nace.code ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="font-mono text-xs mr-2">{nace.code}</span>
                    <span className="truncate text-sm">{nace.description}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
