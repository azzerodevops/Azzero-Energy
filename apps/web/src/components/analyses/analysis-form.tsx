"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAnalysisSchema, type CreateAnalysisInput } from "@azzeroco2/shared";
import { createAnalysis, updateAnalysis } from "@/actions/analyses";

interface Site {
  id: string;
  name: string;
  city: string | null;
}

interface AnalysisFormProps {
  organizationId: string;
  sites: Site[];
  initialData?: Record<string, unknown> & { id: string };
}

export function AnalysisForm({ organizationId, sites, initialData }: AnalysisFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEdit = !!initialData;

  const form = useForm<CreateAnalysisInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createAnalysisSchema) as any,
    defaultValues: {
      organization_id: organizationId,
      site_id: (initialData?.site_id as string) ?? "",
      name: (initialData?.name as string) ?? "",
      description: (initialData?.description as string) ?? "",
      year: (initialData?.year as number) ?? new Date().getFullYear(),
      wacc: (initialData?.wacc as number) ?? 0.08,
    },
  });

  async function onSubmit(values: CreateAnalysisInput) {
    setLoading(true);
    try {
      const result = isEdit
        ? await updateAnalysis(initialData!.id, values)
        : await createAnalysis(values);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(isEdit ? "Analisi aggiornata" : "Analisi creata");
      if (!isEdit && result.data && typeof result.data === "object" && "id" in result.data) {
        router.push(`/dashboard/analyses/${result.data.id}/general`);
      } else {
        router.push("/dashboard/analyses");
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dettagli analisi</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Nome analisi *</FormLabel>
                <FormControl><Input placeholder="Es. Audit energetico 2024" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="site_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Impianto *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona impianto" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}{site.city ? ` — ${site.city}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="year" render={({ field }) => (
              <FormItem>
                <FormLabel>Anno di riferimento *</FormLabel>
                <FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Descrizione</FormLabel>
                <FormControl><Textarea placeholder="Note sull'analisi..." {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="wacc" render={({ field }) => (
              <FormItem>
                <FormLabel>WACC (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="8"
                    value={field.value != null ? (field.value * 100).toFixed(1) : ""}
                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) / 100 : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
            Annulla
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Salvataggio..." : isEdit ? "Aggiorna" : "Crea analisi"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
