"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrganizationStore } from "@/stores/organization-store";
import { switchOrganization } from "@/actions/auth";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface OrganizationSelectorProps {
  isCollapsed: boolean;
}

export function OrganizationSelector({
  isCollapsed,
}: OrganizationSelectorProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    currentOrganization,
    organizations,
    isAzzeroCO2Admin,
    setOrganization,
  } = useOrganizationStore();

  if (!isAzzeroCO2Admin || organizations.length === 0) {
    return null;
  }

  const handleSelect = (orgId: string) => {
    const org = organizations.find((o) => o.id === orgId);
    if (!org || org.id === currentOrganization?.id) {
      setOpen(false);
      return;
    }

    startTransition(async () => {
      const result = await switchOrganization(orgId);
      if (result.success) {
        setOrganization(org);
        router.refresh();
      }
      setOpen(false);
    });
  };

  const initials = currentOrganization?.name
    ? currentOrganization.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "??";

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "mx-auto flex h-9 w-9 items-center justify-center rounded-md text-xs font-semibold",
                  "bg-primary/10 text-primary hover:bg-primary/20 transition-colors",
                  isPending && "opacity-50"
                )}
                disabled={isPending}
              >
                {initials}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" side="right" align="start">
              <OrgCommandList
                organizations={organizations}
                currentOrgId={currentOrganization?.id ?? null}
                onSelect={handleSelect}
              />
            </PopoverContent>
          </Popover>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{currentOrganization?.name ?? "Seleziona organizzazione"}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
            "bg-primary/10 text-foreground hover:bg-primary/20",
            isPending && "opacity-50"
          )}
          disabled={isPending}
        >
          <Building2 className="h-4 w-4 shrink-0 text-primary" />
          <span className="flex-1 truncate text-left">
            {currentOrganization?.name ?? "Seleziona..."}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" side="right" align="start">
        <OrgCommandList
          organizations={organizations}
          currentOrgId={currentOrganization?.id ?? null}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// Internal: Org list with search
// ---------------------------------------------------------------------------

interface OrgCommandListProps {
  organizations: { id: string; name: string; slug: string; plan: string }[];
  currentOrgId: string | null;
  onSelect: (orgId: string) => void;
}

function OrgCommandList({
  organizations,
  currentOrgId,
  onSelect,
}: OrgCommandListProps) {
  return (
    <Command>
      <CommandInput placeholder="Cerca organizzazione..." />
      <CommandList>
        <CommandEmpty>Nessuna organizzazione trovata.</CommandEmpty>
        <CommandGroup>
          {organizations.map((org) => (
            <CommandItem
              key={org.id}
              value={org.name}
              onSelect={() => onSelect(org.id)}
              className="flex items-center gap-2"
            >
              <Check
                className={cn(
                  "h-4 w-4 shrink-0",
                  org.id === currentOrgId ? "opacity-100" : "opacity-0"
                )}
              />
              <span className="flex-1 truncate">{org.name}</span>
              <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">
                {org.plan}
              </Badge>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
