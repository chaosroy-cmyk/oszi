/**
 * willhaben verwendet für das Bundesland-Filter eigene Regions-IDs
 * (URL-Parameter `areaId`). Werte stammen aus dem `region`-Navigator der
 * Such-API und sind hier fix gemappt, damit das Dropdown in der Web-UI
 * ohne zusätzlichen Request funktioniert.
 */
export interface Region {
  id: string;
  name: string;
}

export const REGIONS: Region[] = [
  { id: "", name: "ganz Österreich" },
  { id: "1", name: "Burgenland" },
  { id: "2", name: "Kärnten" },
  { id: "3", name: "Niederösterreich" },
  { id: "4", name: "Oberösterreich" },
  { id: "5", name: "Salzburg" },
  { id: "6", name: "Steiermark" },
  { id: "7", name: "Tirol" },
  { id: "8", name: "Vorarlberg" },
  { id: "900", name: "Wien" },
  { id: "22000", name: "andere Länder" },
];

const BY_ID = new Map(REGIONS.map((r) => [r.id, r]));

export function regionName(areaId: string | undefined | null): string {
  if (!areaId) return "ganz Österreich";
  return BY_ID.get(areaId)?.name ?? `Region ${areaId}`;
}

export function isKnownRegion(areaId: string): boolean {
  return BY_ID.has(areaId);
}
