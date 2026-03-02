"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { createResourceSchema, RESOURCE_TYPE_LABELS } from "@azzeroco2/shared";
import { createResource, updateResource } from "@/actions/resources";

interface ResourceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisId: string;
  initialData?: Record<string, unknown> & { id: string };
}

export function ResourceForm({ open, onOpenChange, analysisId, initialData }: ResourceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEdit = !!initialData;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm({
    resolver: zodResolver(createResourceSchema),
    defaultValues: {
      analysis_id: analysisId,
      resource_type: ((initialData?.resource_type as string) ?? "electricity") as "electricity",
      buying_price: (initialData?.buying_price as number) ?? undefined,
      selling_price: (initialData?.selling_price as number) ?? undefined,
      co2_factor: (initialData?.co2_factor as number) ?? undefined,
      max_availability: (initialData?.max_availability as number) ?? undefined,
      notes: (initialData?.notes as string) ?? "",
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function onSubmit(values: any) {
    setLoading(true);
    try {
      const result = isEdit
        ? await updateResource(initialData!.id, analysisId, values)
        : await createResource(values);
      if (!result.success) { toast.error(result.error); return; }
      toast.success(isEdit ? "Risorsa aggiornata" : "Risorsa aggiunta");
      onOpenChange(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifica risorsa" : "Aggiungi risorsa"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="resource_type" render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo risorsa *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEdit}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(RESOURCE_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="buying_price" render={({ field }) => (
                <FormItem>
                  <FormLabel>Prezzo acquisto (€/MWh)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="150" {...field} value={field.value ?? ""}
                      onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="selling_price" render={({ field }) => (
                <FormItem>
                  <FormLabel>Prezzo vendita (€/MWh)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="50" {...field} value={field.value ?? ""}
                      onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="co2_factor" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fattore CO₂ (tCO₂/MWh)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.001" placeholder="0.233" {...field} value={field.value ?? ""}
                      onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="max_availability" render={({ field }) => (
                <FormItem>
                  <FormLabel>Disponibilità max (MWh/a)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" placeholder="10000" {...field} value={field.value ?? ""}
                      onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Note</FormLabel>
                <FormControl>
                  <Textarea placeholder="Note aggiuntive..." {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Annulla
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvataggio..." : isEdit ? "Aggiorna" : "Aggiungi"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
