/** Países frecuentes en LATAM para WhatsApp */
export const PHONE_COUNTRIES = [
  { code: "PE", dial: "+51", label: "Perú" },
  { code: "MX", dial: "+52", label: "México" },
  { code: "CO", dial: "+57", label: "Colombia" },
  { code: "CL", dial: "+56", label: "Chile" },
  { code: "AR", dial: "+54", label: "Argentina" },
  { code: "EC", dial: "+593", label: "Ecuador" },
  { code: "BO", dial: "+591", label: "Bolivia" },
  { code: "PY", dial: "+595", label: "Paraguay" },
  { code: "UY", dial: "+598", label: "Uruguay" },
  { code: "VE", dial: "+58", label: "Venezuela" },
  { code: "CR", dial: "+506", label: "Costa Rica" },
  { code: "PA", dial: "+507", label: "Panamá" },
  { code: "GT", dial: "+502", label: "Guatemala" },
  { code: "DO", dial: "+1", label: "Rep. Dominicana (+1)" },
  { code: "US", dial: "+1", label: "Estados Unidos (+1)" },
  { code: "ES", dial: "+34", label: "España" },
  { code: "BR", dial: "+55", label: "Brasil" },
] as const;

export const DEFAULT_DIAL = "+51";

export function normalizeToE164(dialCode: string, nationalNumber: string): string {
  const dialDigits = dialCode.replace(/\D/g, "");
  let national = nationalNumber.replace(/\D/g, "");
  if (national.startsWith("0")) national = national.slice(1);
  return `+${dialDigits}${national}`;
}

export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone.replace(/\s/g, ""));
}

export function parseE164ToParts(phone: string): { dial: string; national: string } {
  const normalized = phone.startsWith("+") ? phone : `+${phone.replace(/\D/g, "")}`;
  const sorted = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of sorted) {
    if (normalized.startsWith(c.dial)) {
      return { dial: c.dial, national: normalized.slice(c.dial.length).replace(/\D/g, "") };
    }
  }
  return { dial: DEFAULT_DIAL, national: normalized.replace(/\D/g, "") };
}

export function newRowId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
