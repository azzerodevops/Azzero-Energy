"use client";

import { useEffect, useState } from "react";
import type { LatLngExpression } from "leaflet";
import { cn } from "@/lib/utils";

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

interface SiteMapProps {
  sites: MapSite[];
  onSiteClick?: (siteId: string) => void;
  className?: string;
}

export function SiteMap({ sites, onSiteClick, className }: SiteMapProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [MapComponents, setMapComponents] = useState<any>(null);

  useEffect(() => {
    // Load react-leaflet and fix marker icons in parallel, then set state
    Promise.all([
      import("react-leaflet"),
      import("leaflet"),
    ]).then(([mod, L]) => {
      // Fix default marker icons before rendering
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      setMapComponents({
        MapContainer: mod.MapContainer,
        TileLayer: mod.TileLayer,
        Marker: mod.Marker,
        Popup: mod.Popup,
      });
    });
  }, []);

  if (!MapComponents) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted/50 rounded-lg",
          className
        )}
        style={{ minHeight: 400 }}
      >
        <p className="text-muted-foreground">Caricamento mappa...</p>
      </div>
    );
  }

  // Filter sites with valid coordinates
  const validSites = sites.filter(
    (s) => s.latitude != null && s.longitude != null
  );

  // Default center: Italy
  const defaultCenter: LatLngExpression = [41.9028, 12.4964];

  // If sites exist, center on their bounds
  const center =
    validSites.length > 0
      ? ([
          validSites.reduce((sum, s) => sum + s.latitude!, 0) /
            validSites.length,
          validSites.reduce((sum, s) => sum + s.longitude!, 0) /
            validSites.length,
        ] as LatLngExpression)
      : defaultCenter;

  const { MapContainer, TileLayer, Marker, Popup } = MapComponents;

  return (
    <div
      className={cn("rounded-lg overflow-hidden", className)}
      style={{ minHeight: 400 }}
    >
      <MapContainer
        center={center}
        zoom={validSites.length > 0 ? 6 : 5}
        style={{ height: "100%", width: "100%", minHeight: 400 }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validSites.map((site) => (
          <Marker
            key={site.id}
            position={[site.latitude!, site.longitude!]}
            eventHandlers={{
              click: () => onSiteClick?.(site.id),
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{site.name}</p>
                {site.city && <p className="text-gray-600">{site.city}</p>}
                {site.nace_code && <p>Settore: {site.nace_code}</p>}
                {site.area_sqm && (
                  <p>
                    Superficie: {site.area_sqm.toLocaleString("it-IT")} m&sup2;
                  </p>
                )}
                <p>
                  {site.analysisCount} analisi
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
