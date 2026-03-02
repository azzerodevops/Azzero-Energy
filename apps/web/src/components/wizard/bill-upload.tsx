"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Upload,
  FileImage,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BillData {
  provider: string | null;
  bill_period: string | null;
  consumption_kwh: number | null;
  total_amount_eur: number | null;
  unit_price_eur_kwh: number | null;
  power_kw: number | null;
  meter_number: string | null;
  supply_type: string | null;
  confidence: number;
}

interface BillUploadProps {
  onDataExtracted: (data: BillData) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function BillUpload({ onDataExtracted }: BillUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [billData, setBillData] = useState<BillData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Clean up object URL on unmount or when preview changes
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Formato non supportato. Usa JPEG, PNG o WebP.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "Il file supera la dimensione massima di 10MB.";
    }
    return null;
  }, []);

  const scanBill = useCallback(async (file: File) => {
    setScanning(true);
    setError(null);
    setBillData(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:8000/ocr/bill", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Errore dal server OCR (${response.status}): ${errorBody}`,
        );
      }

      const data: BillData = await response.json();
      setBillData(data);
      toast.success("Dati estratti dalla bolletta con successo!");
    } catch (err) {
      const isNetworkError =
        err instanceof TypeError && (err.message === "Failed to fetch" || err.message === "fetch failed");
      const message = isNetworkError
        ? "Impossibile contattare il servizio OCR. Verifica che il server sia avviato."
        : err instanceof Error
          ? err.message
          : "Errore durante l'analisi della bolletta.";
      setError(message);
      toast.error("Estrazione fallita", { description: message });
    } finally {
      setScanning(false);
    }
  }, []);

  const processFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      // Revoke previous preview URL
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }

      const previewUrl = URL.createObjectURL(file);
      setImageFile(file);
      setImagePreview(previewUrl);
      setError(null);
      setBillData(null);

      // Auto-trigger OCR scan
      scanBill(file);
    },
    [validateFile, scanBill, imagePreview],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragging) setIsDragging(true);
    },
    [isDragging],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    },
    [],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
      // Reset input so the same file can be re-selected
      e.target.value = "";
    },
    [processFile],
  );

  const clearImage = useCallback(() => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    setBillData(null);
    setError(null);
    setScanning(false);
  }, [imagePreview]);

  const updateBillField = useCallback(
    (field: keyof BillData, value: string | number | null) => {
      if (!billData) return;
      setBillData({ ...billData, [field]: value });
    },
    [billData],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileImage className="h-4 w-4" />
          Scansione bolletta (AI)
        </CardTitle>
        <CardDescription>
          Carica una foto della bolletta per estrarre automaticamente i dati di
          consumo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!imageFile ? (
          <div
            role="button"
            tabIndex={0}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
            className={cn(
              "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50",
            )}
          >
            <Upload className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">Trascina qui la bolletta</p>
            <p className="text-xs text-muted-foreground mt-1">
              o clicca per selezionare (JPEG, PNG, max 10MB)
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Image preview + remove button */}
            <div className="relative inline-block">
              <img
                src={imagePreview!}
                alt="Bolletta"
                className="max-h-48 rounded-lg border"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6"
                onClick={clearImage}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* Scanning state */}
            {scanning && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analisi in corso con AI...
              </div>
            )}

            {/* Extracted data */}
            {billData && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium">Dati estratti</span>
                  <Badge variant="outline" className="text-xs">
                    Confidenza: {Math.round(billData.confidence * 100)}%
                  </Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Provider */}
                  <div className="space-y-1.5">
                    <Label htmlFor="bill-provider" className="text-xs">
                      Fornitore
                    </Label>
                    <Input
                      id="bill-provider"
                      value={billData.provider ?? ""}
                      onChange={(e) =>
                        updateBillField(
                          "provider",
                          e.target.value || null,
                        )
                      }
                      placeholder="Non rilevato"
                      className="h-8 text-sm"
                    />
                  </div>

                  {/* Period */}
                  <div className="space-y-1.5">
                    <Label htmlFor="bill-period" className="text-xs">
                      Periodo
                    </Label>
                    <Input
                      id="bill-period"
                      value={billData.bill_period ?? ""}
                      onChange={(e) =>
                        updateBillField(
                          "bill_period",
                          e.target.value || null,
                        )
                      }
                      placeholder="Non rilevato"
                      className="h-8 text-sm"
                    />
                  </div>

                  {/* Consumption kWh */}
                  <div className="space-y-1.5">
                    <Label htmlFor="bill-consumption" className="text-xs">
                      Consumo (kWh)
                    </Label>
                    <Input
                      id="bill-consumption"
                      type="number"
                      min={0}
                      step="0.01"
                      value={billData.consumption_kwh ?? ""}
                      onChange={(e) =>
                        updateBillField(
                          "consumption_kwh",
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                      placeholder="Non rilevato"
                      className="h-8 text-sm"
                    />
                  </div>

                  {/* Total EUR */}
                  <div className="space-y-1.5">
                    <Label htmlFor="bill-total" className="text-xs">
                      Importo totale (EUR)
                    </Label>
                    <Input
                      id="bill-total"
                      type="number"
                      min={0}
                      step="0.01"
                      value={billData.total_amount_eur ?? ""}
                      onChange={(e) =>
                        updateBillField(
                          "total_amount_eur",
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                      placeholder="Non rilevato"
                      className="h-8 text-sm"
                    />
                  </div>

                  {/* Unit price EUR/kWh */}
                  <div className="space-y-1.5">
                    <Label htmlFor="bill-unit-price" className="text-xs">
                      Prezzo unitario (EUR/kWh)
                    </Label>
                    <Input
                      id="bill-unit-price"
                      type="number"
                      min={0}
                      step="0.0001"
                      value={billData.unit_price_eur_kwh ?? ""}
                      onChange={(e) =>
                        updateBillField(
                          "unit_price_eur_kwh",
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                      placeholder="Non rilevato"
                      className="h-8 text-sm"
                    />
                  </div>

                  {/* Supply type */}
                  <div className="space-y-1.5">
                    <Label htmlFor="bill-supply-type" className="text-xs">
                      Tipo fornitura
                    </Label>
                    <Input
                      id="bill-supply-type"
                      value={billData.supply_type ?? ""}
                      onChange={(e) =>
                        updateBillField(
                          "supply_type",
                          e.target.value || null,
                        )
                      }
                      placeholder="Non rilevato"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                <Button onClick={() => onDataExtracted(billData)}>
                  Applica dati estratti
                </Button>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
