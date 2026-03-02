"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface NominatimAddress {
  road?: string;
  house_number?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  country?: string;
  postcode?: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: NominatimAddress;
}

interface AddressSearchResult {
  address: string;
  city: string;
  province: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface AddressSearchProps {
  onSelect: (result: AddressSearchResult) => void;
  defaultValue?: string;
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

function parseAddress(result: NominatimResult): AddressSearchResult {
  const addr = result.address;

  // Build street address from road + house_number
  const parts: string[] = [];
  if (addr.road) parts.push(addr.road);
  if (addr.house_number) parts.push(addr.house_number);
  const streetAddress = parts.join(" ");

  // City: prefer city, then town, then village, then municipality
  const city = addr.city || addr.town || addr.village || addr.municipality || "";

  // Province: county maps to Italian province (e.g. "Milano")
  const province = addr.county || "";

  // Country
  const country = addr.country || "Italia";

  return {
    address: streetAddress,
    city,
    province,
    country,
    latitude: parseFloat(result.lat),
    longitude: parseFloat(result.lon),
  };
}

export function AddressSearch({ onSelect, defaultValue = "" }: AddressSearchProps) {
  const [query, setQuery] = useState(defaultValue);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchAddress = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }

    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        format: "json",
        addressdetails: "1",
        countrycodes: "it",
        q: searchQuery,
        limit: "5",
      });

      const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
        signal: controller.signal,
        headers: {
          "User-Agent": "AzzeroCO2Energy/1.0 (https://azzeroco2.energy)",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const data: NominatimResult[] = await response.json();
      setResults(data);
      setOpen(data.length > 0);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        // Request was cancelled, ignore
        return;
      }
      console.error("Address search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search on query change
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchAddress(query);
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, searchAddress]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  function handleSelect(result: NominatimResult) {
    const parsed = parseAddress(result);
    setQuery(result.display_name);
    setOpen(false);
    onSelect(parsed);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca indirizzo..."
            className="pl-9"
            autoComplete="off"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandList>
            <CommandEmpty>Nessun risultato trovato</CommandEmpty>
            <CommandGroup>
              {results.map((result) => (
                <CommandItem
                  key={result.place_id}
                  value={String(result.place_id)}
                  onSelect={() => handleSelect(result)}
                  className="cursor-pointer"
                >
                  <MapPin className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm">{result.display_name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
