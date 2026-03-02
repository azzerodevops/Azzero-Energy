"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createStorageSchema, STORAGE_TYPE_LABELS } from "@azzeroco2/shared";
import { createStorage, updateStorage } from "@/actions/storage";

interface StorageFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisId: string;
  initialData?: Record<string, unknown> & { id: string };
}

export function StorageForm({ open, onOpenChange, analysisId, initialData }: StorageFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEdit = !!initialData;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm({
    resolver: zodResolver(createStorageSchema),
    defaultValues: {
      analysis_id: analysisId,
      name: (initialData?.name as string) ?? "",
      storage_type: ((initialData?.storage_type as string) ?? "battery_lion") as "battery_lion",
      capacity_kwh: (initialData?.capacity_kwh as number) ?? undefined,
      max_charge_kw: (initialData?.max_charge_kw as number) ?? undefined,
      max_discharge_kw: (initialData?.max_discharge_kw as number) ?? undefined,
      charge_efficiency: (initialData?.charge_efficiency as number) ?? 0.95,
      discharge_efficiency: (initialData?.discharge_efficiency as number) ?? 0.95,
      min_soc: (initialData?.min_soc as number) ?? 0.1,
      max_soc: (initialData?.max_soc as number) ?? 0.9,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function onSubmit(values: any) {
    setLoading(true);
    try {
      const result = isEdit
        ? await updateStorage(initialData!.id, analysisId, values)
        : await createStorage(values);
      if (!result.success) { toast.error(result.error); return; }
      toast.success(isEdit ? "Accumulo aggiornato" : "Accumulo aggiunto");
      onOpenChange(false);
      router.refresh();
    } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{isEdit ? "Modifica accumulo" : "Aggiungi accumulo"}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl><Input placeholder="es. Batteria edificio A" {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="storage_type" render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {Object.entries(STORAGE_TYPE_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="capacity_kwh" render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacità (kWh) *</FormLabel>
                  <FormControl><Input type="number" step="any" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="max_charge_kw" render={({ field }) => (
                <FormItem>
                  <FormLabel>Potenza carica (kW)</FormLabel>
                  <FormControl><Input type="number" step="any" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="max_discharge_kw" render={({ field }) => (
                <FormItem>
                  <FormLabel>Potenza scarica (kW)</FormLabel>
                  <FormControl><Input type="number" step="any" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="charge_efficiency" render={({ field }) => (
                <FormItem>
                  <FormLabel>Efficienza carica (%)</FormLabel>
                  <FormControl><Input type="number" step="1" value={field.value != null ? (field.value * 100).toFixed(0) : ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) / 100 : undefined)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="discharge_efficiency" render={({ field }) => (
                <FormItem>
                  <FormLabel>Efficienza scarica (%)</FormLabel>
                  <FormControl><Input type="number" step="1" value={field.value != null ? (field.value * 100).toFixed(0) : ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) / 100 : undefined)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="min_soc" render={({ field }) => (
                <FormItem>
                  <FormLabel>SOC minimo (%)</FormLabel>
                  <FormControl><Input type="number" step="1" value={field.value != null ? (field.value * 100).toFixed(0) : ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) / 100 : undefined)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="max_soc" render={({ field }) => (
                <FormItem>
                  <FormLabel>SOC massimo (%)</FormLabel>
                  <FormControl><Input type="number" step="1" value={field.value != null ? (field.value * 100).toFixed(0) : ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) / 100 : undefined)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Annulla</Button>
              <Button type="submit" disabled={loading}>{loading ? "Salvataggio..." : isEdit ? "Aggiorna" : "Aggiungi"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
