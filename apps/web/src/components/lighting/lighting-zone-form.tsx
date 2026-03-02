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
import { createLightingZoneSchema, FIXTURE_TYPES } from "@azzeroco2/shared";
import { createLightingZone, updateLightingZone } from "@/actions/lighting";

interface LightingZoneFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisId: string;
  initialData?: Record<string, unknown> & { id: string };
}

export function LightingZoneForm({ open, onOpenChange, analysisId, initialData }: LightingZoneFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEdit = !!initialData;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm({
    resolver: zodResolver(createLightingZoneSchema),
    defaultValues: {
      analysis_id: analysisId,
      zone_name: (initialData?.zone_name as string) ?? "",
      area_sqm: (initialData?.area_sqm as number) ?? undefined,
      current_fixture_type: (initialData?.current_fixture_type as string) ?? "Fluorescente",
      current_wattage: (initialData?.current_wattage as number) ?? undefined,
      fixture_count: (initialData?.fixture_count as number) ?? undefined,
      operating_hours_year: (initialData?.operating_hours_year as number) ?? undefined,
      lux_level: (initialData?.lux_level as number) ?? undefined,
      relamping_fixture_type: (initialData?.relamping_fixture_type as string) ?? "LED",
      relamping_wattage: (initialData?.relamping_wattage as number) ?? undefined,
      relamping_fixture_count: (initialData?.relamping_fixture_count as number) ?? undefined,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function onSubmit(values: any) {
    setLoading(true);
    try {
      const result = isEdit
        ? await updateLightingZone(initialData!.id, analysisId, values)
        : await createLightingZone(values);
      if (!result.success) { toast.error(result.error); return; }
      toast.success(isEdit ? "Zona aggiornata" : "Zona aggiunta");
      onOpenChange(false);
      router.refresh();
    } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{isEdit ? "Modifica zona" : "Aggiungi zona illuminazione"}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="zone_name" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Nome zona *</FormLabel>
                  <FormControl><Input placeholder="Es. Capannone A" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="area_sqm" render={({ field }) => (
                <FormItem>
                  <FormLabel>Area (m2)</FormLabel>
                  <FormControl><Input type="number" step="any" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="current_fixture_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo lampada attuale</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {FIXTURE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="current_wattage" render={({ field }) => (
                <FormItem>
                  <FormLabel>Potenza/lampada (W)</FormLabel>
                  <FormControl><Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="fixture_count" render={({ field }) => (
                <FormItem>
                  <FormLabel>N. lampade</FormLabel>
                  <FormControl><Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="operating_hours_year" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ore/anno</FormLabel>
                  <FormControl><Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="lux_level" render={({ field }) => (
                <FormItem>
                  <FormLabel>Livello lux</FormLabel>
                  <FormControl><Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3">Proposta Relamping</h4>
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField control={form.control} name="relamping_fixture_type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo LED proposto</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value ?? "LED"}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {FIXTURE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="relamping_wattage" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Potenza LED (W)</FormLabel>
                    <FormControl><Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="relamping_fixture_count" render={({ field }) => (
                  <FormItem>
                    <FormLabel>N. LED</FormLabel>
                    <FormControl><Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
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
