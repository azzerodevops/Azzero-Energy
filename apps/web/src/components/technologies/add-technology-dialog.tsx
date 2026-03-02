"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { getCatalog, addTechToAnalysis } from "@/actions/technologies";

interface CatalogItem {
  id: string;
  name: string;
  category: string;
  description: string | null;
  capacity_unit: string | null;
}

interface AddTechnologyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisId: string;
  existingTechIds: string[];
}

export function AddTechnologyDialog({ open, onOpenChange, analysisId, existingTechIds }: AddTechnologyDialogProps) {
  const router = useRouter();
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [capacity, setCapacity] = useState("");
  const [isExisting, setIsExisting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      getCatalog().then((res) => {
        if (res.success) setCatalog(res.data as CatalogItem[]);
      });
      setSelected(null);
      setCapacity("");
      setIsExisting(false);
      setSearch("");
    }
  }, [open]);

  const filtered = catalog.filter(
    (t) =>
      !existingTechIds.includes(t.id) &&
      (t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase()))
  );

  const grouped = filtered.reduce<Record<string, CatalogItem[]>>((acc, t) => {
    (acc[t.category] ??= []).push(t);
    return acc;
  }, {});

  async function handleAdd() {
    if (!selected) return;
    setLoading(true);
    try {
      const result = await addTechToAnalysis({
        analysis_id: analysisId,
        technology_id: selected.id,
        installed_capacity_kw: capacity ? Number(capacity) : 0,
        is_existing: isExisting,
      });
      if (!result.success) { toast.error(result.error); return; }
      toast.success(`${selected.name} aggiunta`);
      onOpenChange(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Aggiungi tecnologia</DialogTitle>
        </DialogHeader>

        {!selected ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca tecnologia..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {Object.entries(grouped).map(([category, techs]) => (
                  <div key={category}>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">{category}</h4>
                    <div className="grid gap-2">
                      {techs.map((tech) => (
                        <button
                          key={tech.id}
                          className="flex items-center justify-between rounded-lg border p-3 text-left hover:bg-accent transition-colors"
                          onClick={() => setSelected(tech)}
                        >
                          <div>
                            <p className="font-medium">{tech.name}</p>
                            {tech.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">{tech.description}</p>
                            )}
                          </div>
                          {tech.capacity_unit && (
                            <Badge variant="secondary">{tech.capacity_unit}</Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {Object.keys(grouped).length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">Nessuna tecnologia trovata</p>
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold">{selected.name}</h4>
              <p className="text-sm text-muted-foreground">{selected.category}</p>
              {selected.description && <p className="text-sm mt-1">{selected.description}</p>}
            </div>
            <div className="space-y-3">
              <div>
                <Label>Capacita installata {selected.capacity_unit ? `(${selected.capacity_unit})` : "(kW)"}</Label>
                <Input type="number" step="any" placeholder="100" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="mt-1" />
              </div>
              <label htmlFor="is-existing-checkbox" className="flex items-center gap-2">
                <Checkbox id="is-existing-checkbox" checked={isExisting} onCheckedChange={(c) => setIsExisting(!!c)} />
                <span className="text-sm">Tecnologia gia esistente nell&apos;impianto</span>
              </label>
            </div>
          </div>
        )}

        <DialogFooter>
          {selected ? (
            <>
              <Button variant="outline" onClick={() => setSelected(null)} disabled={loading}>Indietro</Button>
              <Button onClick={handleAdd} disabled={loading}>
                {loading ? "Aggiunta..." : "Aggiungi tecnologia"}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>Chiudi</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
