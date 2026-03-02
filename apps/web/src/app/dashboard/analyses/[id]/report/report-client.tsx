"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  FileSpreadsheet,
  Presentation,
  Download,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";

interface ReportClientProps {
  analysisId: string;
  scenarios: {
    id: string;
    name: string;
    objective: string;
    status: string;
  }[];
  reports: {
    id: string;
    name: string;
    format: string;
    file_url: string | null;
    created_at: string;
  }[];
}

export function ReportClient({
  analysisId,
  scenarios,
  reports,
}: ReportClientProps) {
  const [selectedScenario, setSelectedScenario] = useState<string>("");
  const [format, setFormat] = useState<string>("docx");
  const [generating, setGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const formatIcon = {
    docx: FileText,
    xlsx: FileSpreadsheet,
    pptx: Presentation,
  } as const;

  if (scenarios.length === 0) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/analyses/${analysisId}/scenarios`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Torna agli scenari
          </Link>
        </Button>
        <EmptyState
          icon={FileText}
          title="Nessuno scenario completato"
          description="Completa almeno uno scenario per generare un report."
          actionLabel="Vai agli scenari"
          actionHref={`/dashboard/analyses/${analysisId}/scenarios`}
        />
      </div>
    );
  }

  async function handleGenerate() {
    if (!selectedScenario) {
      toast.error("Seleziona uno scenario");
      return;
    }
    setGenerating(true);
    setDownloadUrl(null);

    try {
      // 1. Start generation
      const res = await fetch(
        `http://localhost:8000/report/${selectedScenario}?analysis_id=${analysisId}&format=${format}`,
        { method: "POST" },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Errore nella generazione");
      }
      const { job_id } = await res.json();

      // 2. Poll for status
      let status = "queued";
      while (status !== "completed" && status !== "failed") {
        await new Promise((r) => setTimeout(r, 2000));
        const statusRes = await fetch(
          `http://localhost:8000/report/${job_id}/status`,
        );
        const statusData = await statusRes.json();
        status = statusData.status;
      }

      if (status === "completed") {
        setDownloadUrl(`http://localhost:8000/report/${job_id}/download`);
        toast.success("Report generato con successo!");
      } else {
        toast.error("Generazione report fallita");
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/analyses/${analysisId}/scenarios`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-xl font-bold">Genera report</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nuovo report</CardTitle>
          <CardDescription>
            Seleziona uno scenario e il formato per generare il report
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="scenario-select" className="text-sm font-medium">Scenario</label>
              <Select
                onValueChange={setSelectedScenario}
                value={selectedScenario}
              >
                <SelectTrigger id="scenario-select">
                  <SelectValue placeholder="Seleziona scenario" />
                </SelectTrigger>
                <SelectContent>
                  {scenarios.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="format-select" className="text-sm font-medium">Formato</label>
              <Select onValueChange={setFormat} value={format}>
                <SelectTrigger id="format-select">
                  <SelectValue placeholder="Seleziona formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="docx">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" /> DOCX (Word)
                    </span>
                  </SelectItem>
                  <SelectItem value="xlsx">
                    <span className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" /> XLSX (Excel)
                    </span>
                  </SelectItem>
                  <SelectItem value="pptx">
                    <span className="flex items-center gap-2">
                      <Presentation className="h-4 w-4" /> PPTX (PowerPoint)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleGenerate}
              disabled={generating || !selectedScenario}
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Generazione in corso...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" /> Genera report
                </>
              )}
            </Button>
            {downloadUrl && (
              <Button variant="outline" asChild>
                <a href={downloadUrl} download>
                  <Download className="mr-2 h-4 w-4" /> Scarica{" "}
                  {format.toUpperCase()}
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Previous reports */}
      {reports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Report precedenti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    {(() => {
                      const Icon =
                        formatIcon[
                          report.format as keyof typeof formatIcon
                        ] ?? FileText;
                      return (
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      );
                    })()}
                    <div>
                      <p className="text-sm font-medium">{report.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(report.created_at).toLocaleDateString(
                          "it-IT",
                        )}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {report.format.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
