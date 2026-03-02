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
import { createDemandSchema, END_USE_LABELS } from "@azzeroco2/shared";
import { createDemand, updateDemand } from "@/actions/demands";

interface DemandFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisId: string;
  initialData?: Record<string, unknown> & { id: string };
}

export function DemandForm({ open, onOpenChange, analysisId, initialData }: DemandFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEdit = !!initialData;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm({
    resolver: zodResolver(createDemandSchema),
    defaultValues: {
      analysis_id: analysisId,
      end_use: ((initialData?.end_use as string) ?? "ELECTRICITY") as "ELECTRICITY",
      annual_consumption_mwh: (initialData?.annual_consumption_mwh as number) ?? undefined,
      profile_type: ((initialData?.profile_type as string) ?? "nace_default") as "nace_default",
      notes: (initialData?.notes as string) ?? "",
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function onSubmit(values: any) {
    setLoading(true);
    try {
      const result = isEdit
        ? await updateDemand(initialData!.id, analysisId, values)
        : await createDemand(values);
      if (!result.success) { toast.error(result.error); return; }
      toast.success(isEdit ? "Domanda aggiornata" : "Domanda aggiunta");
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
          <DialogTitle>{isEdit ? "Modifica domanda" : "Aggiungi domanda energetica"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="end_use" render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo di utilizzo *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(END_USE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="annual_consumption_mwh" render={({ field }) => (
              <FormItem>
                <FormLabel>Consumo annuale (MWh) *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" placeholder="1000" {...field} value={field.value ?? ""}
                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="profile_type" render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo profilo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value ?? "nace_default"}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="nace_default">Profilo NACE (default)</SelectItem>
                    <SelectItem value="custom">Personalizzato</SelectItem>
                    <SelectItem value="upload">Caricamento file</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Note</FormLabel>
                <FormControl><Textarea placeholder="Note aggiuntive..." {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Annulla</Button>
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
