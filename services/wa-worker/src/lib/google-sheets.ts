/** Extrae ID y gid de una URL de Google Sheets. */
export function parseGoogleSheetUrl(url: string): { sheetId: string; gid: string } | null {
  const trimmed = url.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match?.[1]) return null;
  const gidMatch = trimmed.match(/[?&#]gid=(\d+)/);
  return { sheetId: match[1], gid: gidMatch?.[1] ?? "0" };
}

/** Descarga una hoja pública como CSV (máx ~80 KB de contexto). */
export async function fetchGoogleSheetCsv(sheetUrl: string, gid?: string): Promise<string> {
  const parsed = parseGoogleSheetUrl(sheetUrl);
  if (!parsed) throw new Error("URL de Google Sheet inválida");

  const exportGid = gid ?? parsed.gid;
  const exportUrl = `https://docs.google.com/spreadsheets/d/${parsed.sheetId}/export?format=csv&gid=${exportGid}`;

  const res = await fetch(exportUrl, {
    signal: AbortSignal.timeout(20_000),
    headers: { "User-Agent": "UniWai-Bot/1.0" },
  });

  if (!res.ok) {
    throw new Error(
      `No se pudo leer el Sheet (${res.status}). Publícalo: Archivo → Compartir → Cualquier persona con el enlace.`,
    );
  }

  const csv = await res.text();
  return csv.slice(0, 80_000);
}
