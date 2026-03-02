import type { Metadata } from "next";
import { getSitesForMap } from "@/actions/dashboard";
import { MapClient } from "./map-client";

export const metadata: Metadata = { title: "Mappa Siti" };
export const dynamic = "force-dynamic";

export default async function MapPage() {
  const result = await getSitesForMap();
  const sites = result.success ? result.data : [];
  return <MapClient sites={sites} />;
}
