"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search, Building2 } from "lucide-react";
import { SiteMap } from "@/components/map/site-map";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MapSite {
  id: string;
  name: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  nace_code: string | null;
  sector: string | null;
  area_sqm: number | null;
  analysisCount: number;
}

interface MapClientProps {
  sites: MapSite[];
}

export function MapClient({ sites }: MapClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filteredSites = sites.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.city?.toLowerCase() ?? "").includes(search.toLowerCase())
  );

  const handleSiteClick = (siteId: string) => {
    router.push(`/dashboard/sites/${siteId}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mappa impianti</h1>
        <p className="text-muted-foreground">
          Visualizzazione geografica dei tuoi siti
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        {/* Map - takes most space */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <SiteMap
              sites={filteredSites}
              onSiteClick={handleSiteClick}
              className="h-[600px]"
            />
          </CardContent>
        </Card>

        {/* Sidebar with site list */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Siti ({filteredSites.length})
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca sito..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {filteredSites.map((site) => (
                <div
                  key={site.id}
                  role="button"
                  tabIndex={0}
                  className="px-4 py-3 border-b cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSiteClick(site.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSiteClick(site.id); } }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{site.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {site.city ?? "\u2014"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {site.latitude != null && site.longitude != null && (
                        <MapPin className="h-3 w-3 text-emerald-500" />
                      )}
                      <Badge variant="outline" className="text-xs">
                        {site.analysisCount} analisi
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
              {filteredSites.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  <MapPin className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>Nessun sito trovato</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
