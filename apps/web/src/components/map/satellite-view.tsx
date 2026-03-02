"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Satellite, Sun, Ruler, Zap } from "lucide-react";

interface SatelliteViewProps {
  siteName: string;
  latitude: number | null;
  longitude: number | null;
  roofAreaSqm: number | null;
  satelliteImageUrl: string | null;
}

export function SatelliteView({
  siteName,
  latitude,
  longitude,
  roofAreaSqm,
}: SatelliteViewProps) {
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
        Circle: mod.Circle,
      });
    });
  }, []);

  // No coordinates available
  if (latitude == null || longitude == null) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Satellite className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p>Coordinate non disponibili per {siteName}</p>
          <p className="text-xs mt-1">
            Aggiungi latitudine e longitudine nella scheda del sito
          </p>
        </CardContent>
      </Card>
    );
  }

  // Simple PV potential calculation
  // Average solar irradiance in Italy: ~1400 kWh/m²/year
  // PV panel efficiency: ~20%
  // Usable roof area: ~60% of total
  const usableArea = (roofAreaSqm ?? 0) * 0.6;
  const pvCapacityKw = usableArea * 0.2; // ~200W/m² panels
  const annualProductionMwh = (usableArea * 1400 * 0.2) / 1000;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Satellite className="h-4 w-4" />
          Vista satellitare — {siteName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Satellite Map */}
        {MapComponents ? (
          <div className="rounded-lg overflow-hidden" style={{ height: 300 }}>
            <MapComponents.MapContainer
              center={[latitude, longitude]}
              zoom={18}
              style={{ height: "100%", width: "100%" }}
              className="z-0"
            >
              <MapComponents.TileLayer
                attribution="Tiles &copy; Esri"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
              <MapComponents.Marker position={[latitude, longitude]} />
              {roofAreaSqm && (
                <MapComponents.Circle
                  center={[latitude, longitude]}
                  radius={Math.sqrt(roofAreaSqm / Math.PI)}
                  pathOptions={{
                    color: "#0097D7",
                    fillColor: "#0097D7",
                    fillOpacity: 0.2,
                  }}
                />
              )}
            </MapComponents.MapContainer>
          </div>
        ) : (
          <div
            className="flex items-center justify-center bg-muted/50 rounded-lg"
            style={{ height: 300 }}
          >
            <p className="text-muted-foreground">
              Caricamento vista satellitare...
            </p>
          </div>
        )}

        {/* PV Potential Info */}
        {roofAreaSqm && roofAreaSqm > 0 && (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Ruler className="h-3 w-3" />
                Area tetto
              </div>
              <p className="text-lg font-semibold">
                {roofAreaSqm.toLocaleString("it-IT")} m²
              </p>
              <p className="text-xs text-muted-foreground">
                Area utile:{" "}
                {usableArea.toLocaleString("it-IT", {
                  maximumFractionDigits: 0,
                })}{" "}
                m²
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Sun className="h-3 w-3" />
                Potenza FV stimata
              </div>
              <p className="text-lg font-semibold">
                {pvCapacityKw.toLocaleString("it-IT", {
                  maximumFractionDigits: 0,
                })}{" "}
                kW
              </p>
              <p className="text-xs text-muted-foreground">
                Pannelli 200 W/m²
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Zap className="h-3 w-3" />
                Produzione annua
              </div>
              <p className="text-lg font-semibold">
                {annualProductionMwh.toLocaleString("it-IT", {
                  maximumFractionDigits: 0,
                })}{" "}
                MWh
              </p>
              <p className="text-xs text-muted-foreground">
                Irraggiamento: 1.400 kWh/m²/a
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
