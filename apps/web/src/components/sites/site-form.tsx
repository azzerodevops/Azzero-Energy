"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSiteSchema, type CreateSiteInput, getNaceProfile } from "@azzeroco2/shared";
import { createSite, updateSite } from "@/actions/sites";
import { AddressSearch } from "./address-search";
import { NaceSelector } from "./nace-selector";

const WEEK_DAYS = [
  { id: "lun", label: "Lun" },
  { id: "mar", label: "Mar" },
  { id: "mer", label: "Mer" },
  { id: "gio", label: "Gio" },
  { id: "ven", label: "Ven" },
  { id: "sab", label: "Sab" },
  { id: "dom", label: "Dom" },
];

interface SiteFormProps {
  organizationId: string;
  initialData?: Record<string, unknown> & { id: string };
}

export function SiteForm({ organizationId, initialData }: SiteFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [naceAutoFilled, setNaceAutoFilled] = useState(false);
  const isEdit = !!initialData;

  const form = useForm<CreateSiteInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createSiteSchema) as any,
    defaultValues: {
      organization_id: organizationId,
      name: (initialData?.name as string) ?? "",
      address: (initialData?.address as string) ?? "",
      city: (initialData?.city as string) ?? "",
      province: (initialData?.province as string) ?? "",
      country: (initialData?.country as string) ?? "Italia",
      latitude: (initialData?.latitude as number) ?? undefined,
      longitude: (initialData?.longitude as number) ?? undefined,
      nace_code: (initialData?.nace_code as string) ?? "",
      sector: (initialData?.sector as string) ?? "",
      employees: (initialData?.employees as number) ?? undefined,
      area_sqm: (initialData?.area_sqm as number) ?? undefined,
      roof_area_sqm: (initialData?.roof_area_sqm as number) ?? undefined,
      operating_hours: (initialData?.operating_hours as number) ?? undefined,
      working_days: (initialData?.working_days as string[]) ?? ["lun", "mar", "mer", "gio", "ven"],
    },
  });

  async function onSubmit(values: CreateSiteInput) {
    setLoading(true);
    try {
      const result = isEdit
        ? await updateSite(initialData!.id, values)
        : await createSite(values);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(isEdit ? "Impianto aggiornato" : "Impianto creato");
      router.push("/dashboard/sites");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Section: Info base */}
        <Card>
          <CardHeader>
            <CardTitle>Informazioni generali</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Nome impianto *</FormLabel>
                <FormControl><Input placeholder="Es. Stabilimento Milano" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            {/* Ricerca indirizzo con autocompletamento */}
            <div className="sm:col-span-2 space-y-2">
              <label className="text-sm font-medium leading-none">Cerca indirizzo *</label>
              <AddressSearch
                defaultValue={form.getValues("address") ? `${form.getValues("address")}, ${form.getValues("city") ?? ""}` : ""}
                onSelect={(result) => {
                  form.setValue("address", result.address, { shouldValidate: true });
                  form.setValue("city", result.city, { shouldValidate: true });
                  form.setValue("province", result.province, { shouldValidate: true });
                  form.setValue("country", result.country, { shouldValidate: true });
                  form.setValue("latitude", result.latitude, { shouldValidate: true });
                  form.setValue("longitude", result.longitude, { shouldValidate: true });
                }}
              />
              <p className="text-xs text-muted-foreground">
                Digita almeno 3 caratteri per cercare. Seleziona un risultato per compilare automaticamente indirizzo, città, coordinate.
              </p>
            </div>

            {/* Campi compilati automaticamente (modificabili) */}
            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Indirizzo</FormLabel>
                <FormControl><Input placeholder="Compilato automaticamente dalla ricerca" {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="city" render={({ field }) => (
              <FormItem>
                <FormLabel>Città</FormLabel>
                <FormControl><Input placeholder="Compilato automaticamente" {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="province" render={({ field }) => (
              <FormItem>
                <FormLabel>Provincia</FormLabel>
                <FormControl><Input placeholder="Compilato automaticamente" {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="country" render={({ field }) => (
              <FormItem>
                <FormLabel>Paese</FormLabel>
                <FormControl><Input {...field} value={field.value ?? "Italia"} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="nace_code" render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Codice NACE</FormLabel>
                <FormControl>
                  <NaceSelector
                    value={field.value ?? ""}
                    onSelect={(code, sectorLabel) => {
                      field.onChange(code);
                      // Auto-fill the sector field based on NACE section
                      form.setValue("sector", sectorLabel, { shouldValidate: true });
                      // Auto-fill operating hours and working days from energy profile
                      const profile = getNaceProfile(code);
                      if (profile) {
                        // Only auto-fill if the fields are currently empty or this is the first auto-fill
                        const currentHours = form.getValues("operating_hours");
                        const currentDays = form.getValues("working_days");
                        if (!currentHours || !naceAutoFilled) {
                          form.setValue("operating_hours", profile.typical_operating_hours, { shouldValidate: true });
                        }
                        if ((!currentDays || currentDays.length === 0) || !naceAutoFilled) {
                          form.setValue("working_days", profile.typical_working_days, { shouldValidate: true });
                        }
                        setNaceAutoFilled(true);
                        toast.info(`Dati operativi precompilati per settore "${profile.sector}"`);
                      }
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Seleziona il codice NACE per compilare automaticamente settore e dati operativi
                </FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="sector" render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Settore</FormLabel>
                <FormControl><Input placeholder="Compilato automaticamente dal codice NACE" {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="employees" render={({ field }) => (
              <FormItem>
                <FormLabel>Dipendenti</FormLabel>
                <FormControl><Input type="number" placeholder="50" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        {/* Section: Coordinate e area */}
        <Card>
          <CardHeader>
            <CardTitle>Ubicazione e superfici</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="latitude" render={({ field }) => (
              <FormItem>
                <FormLabel>Latitudine</FormLabel>
                <FormControl><Input type="number" step="any" placeholder="Compilato dalla ricerca indirizzo" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} readOnly className="bg-muted/50" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="longitude" render={({ field }) => (
              <FormItem>
                <FormLabel>Longitudine</FormLabel>
                <FormControl><Input type="number" step="any" placeholder="Compilato dalla ricerca indirizzo" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} readOnly className="bg-muted/50" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="area_sqm" render={({ field }) => (
              <FormItem>
                <FormLabel>Area (m²)</FormLabel>
                <FormControl><Input type="number" step="any" placeholder="5000" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="roof_area_sqm" render={({ field }) => (
              <FormItem>
                <FormLabel>Area tetto FV (m²)</FormLabel>
                <FormControl><Input type="number" step="any" placeholder="2000" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        {/* Section: Operatività */}
        <Card>
          <CardHeader>
            <CardTitle>Operatività</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="operating_hours" render={({ field }) => (
              <FormItem>
                <FormLabel>Ore operative annue</FormLabel>
                <FormControl><Input type="number" placeholder="2000" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="working_days" render={({ field }) => (
              <FormItem>
                <FormLabel>Giorni lavorativi</FormLabel>
                <div className="flex flex-wrap gap-4 pt-2">
                  {WEEK_DAYS.map((day) => (
                    <label key={day.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={(field.value ?? []).includes(day.id)}
                        onCheckedChange={(checked) => {
                          const current = field.value ?? [];
                          field.onChange(
                            checked
                              ? [...current, day.id]
                              : current.filter((d: string) => d !== day.id)
                          );
                        }}
                      />
                      {day.label}
                    </label>
                  ))}
                </div>
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
            {loading ? "Salvataggio..." : isEdit ? "Aggiorna" : "Crea impianto"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
