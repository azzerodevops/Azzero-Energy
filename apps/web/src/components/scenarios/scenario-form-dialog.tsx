"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createScenario, updateScenario } from "@/actions/scenarios";

interface ScenarioFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisId: string;
  scenario?: {
    id: string;
    name: string;
    description: string | null;
    objective: string;
    co2_target: string | null;
    budget_limit: string | null;
  } | null;
}

// Convert stored decimal co2_target (0-1) to percentage string for display (0-100)
function co2TargetToPercent(val: string | null | undefined): string {
  if (!val) return "";
  const n = parseFloat(val);
  if (isNaN(n)) return "";
  return String(Math.round(n * 100));
}

export function ScenarioFormDialog({ open, onOpenChange, analysisId, scenario }: ScenarioFormDialogProps) {
  const router = useRouter();
  const isEditing = !!scenario;
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(scenario?.name ?? "");
  const [description, setDescription] = useState(scenario?.description ?? "");
  const [objective, setObjective] = useState(scenario?.objective ?? "cost");
  const [co2Target, setCo2Target] = useState(co2TargetToPercent(scenario?.co2_target));
  const [budgetLimit, setBudgetLimit] = useState(scenario?.budget_limit ?? "");

  // Sync form state when scenario prop changes (e.g., editing a different scenario)
  useEffect(() => {
    setName(scenario?.name ?? "");
    setDescription(scenario?.description ?? "");
    setObjective(scenario?.objective ?? "cost");
    setCo2Target(co2TargetToPercent(scenario?.co2_target));
    setBudgetLimit(scenario?.budget_limit ?? "");
  }, [scenario?.id, scenario?.name, scenario?.description, scenario?.objective, scenario?.co2_target, scenario?.budget_limit]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        analysis_id: analysisId,
        name,
        description: description || null,
        objective,
        co2_target: co2Target ? parseFloat(co2Target) / 100 : null,
        budget_limit: budgetLimit ? parseFloat(budgetLimit) : null,
      };

      const result = isEditing
        ? await updateScenario(scenario!.id, analysisId, payload)
        : await createScenario(payload);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(isEditing ? "Scenario aggiornato" : "Scenario creato");
      onOpenChange(false);
      // Reset form for next open
      if (!isEditing) {
        setName("");
        setDescription("");
        setObjective("cost");
        setCo2Target("");
        setBudgetLimit("");
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifica scenario" : "Nuovo scenario"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica i parametri dello scenario di ottimizzazione."
              : "Configura un nuovo scenario di ottimizzazione energetica."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="scenario-name">Nome *</Label>
            <Input
              id="scenario-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="es. Scenario base costi"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scenario-desc">Descrizione</Label>
            <Textarea
              id="scenario-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrizione opzionale..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scenario-objective">Obiettivo</Label>
            <Select value={objective} onValueChange={setObjective}>
              <SelectTrigger id="scenario-objective">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cost">Minimizzazione costi</SelectItem>
                <SelectItem value="decarbonization">Decarbonizzazione</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {objective === "decarbonization" && (
            <div className="space-y-2">
              <Label htmlFor="co2-target">Obiettivo riduzione CO₂ (0-100%)</Label>
              <Input
                id="co2-target"
                type="number"
                min="0"
                max="100"
                step="1"
                value={co2Target}
                onChange={(e) => setCo2Target(e.target.value)}
                placeholder="es. 50"
              />
              <p className="text-xs text-muted-foreground">
                Percentuale di riduzione CO₂ desiderata rispetto al baseline.
              </p>
            </div>
          )}

          {objective === "decarbonization" && (
            <div className="space-y-2">
              <Label htmlFor="budget-limit">Limite di budget (€)</Label>
              <Input
                id="budget-limit"
                type="number"
                min="0"
                step="1000"
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(e.target.value)}
                placeholder="es. 500000"
              />
              <p className="text-xs text-muted-foreground">
                Budget massimo annuo. Lascia vuoto per nessun limite.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Salvataggio..." : isEditing ? "Salva" : "Crea scenario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
