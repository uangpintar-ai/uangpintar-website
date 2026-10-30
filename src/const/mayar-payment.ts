export const MAYAR_PAYMENT_METHODS = [
  "qris",
  "va/bni",
  "va/bri",
  "va/mandiri",
  "va/bsi",
  "va/permata",
  "va/cimb",
  "ewallet/dana",
  "ewallet/gopay",
  "ewallet/shopeepay",
  "ewallet/linkaja",
] as const;

export type MayarPaymentMethod = (typeof MAYAR_PAYMENT_METHODS)[number];

export const PAYMENT_CHANNELS: {
  code: MayarPaymentMethod;
  label: string;
  note: string;
}[] = [
  { code: "qris", label: "QRIS", note: "Semua e-wallet & m-banking" },
  { code: "va/bni", label: "BNI", note: "Virtual account" },
  { code: "va/bri", label: "BRI", note: "Virtual account" },
  { code: "va/mandiri", label: "Mandiri", note: "Virtual account" },
  { code: "va/bsi", label: "BSI", note: "Virtual account" },
  { code: "va/permata", label: "Permata", note: "Virtual account" },
  { code: "va/cimb", label: "CIMB Niaga", note: "Virtual account" },
  { code: "ewallet/dana", label: "DANA", note: "E-wallet" },
  { code: "ewallet/gopay", label: "GoPay", note: "E-wallet" },
  { code: "ewallet/shopeepay", label: "ShopeePay", note: "E-wallet" },
  { code: "ewallet/linkaja", label: "LinkAja", note: "E-wallet" },
];

export const DEFAULT_PAYMENT_METHOD: MayarPaymentMethod = "qris";

export const isMayarPaymentMethod = (
  value: string | null | undefined,
): value is MayarPaymentMethod =>
  MAYAR_PAYMENT_METHODS.includes(value as MayarPaymentMethod);

export type PaymentLink = {
  kind: "deeplink" | "mobile" | "web";
  url: string;
};

export type MayarPaymentDetail =
  | {
      kind: "qris";
      qrString: string;
    }
  | {
      kind: "virtual_account";
      accountName: string | null;
      accountNumber: string;
      bank: string;
    }
  | {
      channel: string;
      kind: "ewallet";
      links: PaymentLink[];
      qrString: string | null;
    };

const ALLOWED_LINK_SCHEMES = new Set([
  "dana:",
  "gojek:",
  "https:",
  "jenius:",
  "linkaja:",
  "ovo:",
  "shopee:",
  "shopeeid:",
]);

const record = (value: unknown) =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const text = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const safeUrl = (value: unknown) => {
  const raw = text(value);

  if (!raw) return null;

  try {
    return ALLOWED_LINK_SCHEMES.has(new URL(raw).protocol) ? raw : null;
  } catch {
    return null;
  }
};

const linkKind = (value: unknown): PaymentLink["kind"] | null => {
  switch (text(value)?.toUpperCase()) {
    case "DEEPLINK":
      return "deeplink";
    case "MOBILE":
      return "mobile";
    case "WEB":
      return "web";
    default:
      return null;
  }
};

const parseQris = (
  detail: Record<string, unknown>,
): MayarPaymentDetail | null => {
  const properties = record(record(detail.qr_code)?.channel_properties);
  const qrString = text(properties?.qr_string) ?? text(properties?.qrString);

  return qrString ? { kind: "qris", qrString } : null;
};

const parseVirtualAccount = (
  detail: Record<string, unknown>,
): MayarPaymentDetail | null => {
  const account = record(detail.virtual_account);
  const properties = record(account?.channel_properties);
  const accountNumber = text(properties?.virtual_account_number);
  const bank = text(account?.channel_code);

  return accountNumber && bank
    ? {
        accountName: text(properties?.customer_name),
        accountNumber,
        bank,
        kind: "virtual_account",
      }
    : null;
};

const parseEwallet = (
  detail: Record<string, unknown>,
): MayarPaymentDetail | null => {
  const wallet = record(detail.ewallet);
  const channel = text(wallet?.channel_code);
  const actions = Array.isArray(detail.actions) ? detail.actions : [];
  const links: PaymentLink[] = [];
  let qrString: string | null = null;

  for (const entry of actions) {
    const action = record(entry);

    if (!action) continue;

    qrString ??= text(action.qr_code);

    const kind = linkKind(action.url_type);
    const url = safeUrl(action.url);

    if (kind && url) links.push({ kind, url });
  }

  if (!channel || (links.length === 0 && !qrString)) return null;

  return { channel, kind: "ewallet", links, qrString };
};

export const parseMayarPaymentDetail = (
  value: unknown,
): MayarPaymentDetail | null => {
  const detail = record(value);

  if (!detail) return null;

  switch (text(detail.type)?.toUpperCase()) {
    case "EWALLET":
      return parseEwallet(detail);
    case "QR_CODE":
    case "QRIS":
      return parseQris(detail);
    case "VIRTUAL_ACCOUNT":
      return parseVirtualAccount(detail);
    default:
      return null;
  }
};
