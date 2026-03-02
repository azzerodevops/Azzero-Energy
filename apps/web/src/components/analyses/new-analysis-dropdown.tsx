"use client";

import Link from "next/link";
import { Plus, Wand2, FileEdit, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NewAnalysisDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuova analisi
          <ChevronDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem asChild>
          <Link href="/dashboard/analyses/new" className="flex items-start gap-3 p-3">
            <Wand2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <div className="font-medium">Procedura guidata</div>
              <div className="text-xs text-muted-foreground">
                Wizard 5 step con stima AI e OCR bollette
              </div>
            </div>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/analyses/new/manual" className="flex items-start gap-3 p-3">
            <FileEdit className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
            <div>
              <div className="font-medium">Creazione manuale</div>
              <div className="text-xs text-muted-foreground">
                Crea e compila ogni sezione tramite le tab
              </div>
            </div>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
