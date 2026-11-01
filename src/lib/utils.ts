/* eslint-disable @typescript-eslint/prefer-regexp-exec */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import crypto from "crypto";

/** Aplikasi ini untuk pengguna WIB; semua tampilan tanggal memakai zona ini. */
export const WIB_TIME_ZONE = "Asia/Jakarta";
export const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Date yang komponen UTC-nya mewakili tanggal/jam dinding WIB. */
export const toWibDate = (date: Date | string = new Date()) =>
  new Date(new Date(date).getTime() + WIB_OFFSET_MS);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: WIB_TIME_ZONE,
  });
}

export function formatLongDate(dateString?: string): string {
  const date = new Date(dateString ?? "now");
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: WIB_TIME_ZONE,
  });
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: WIB_TIME_ZONE,
  });
}

export function formatDateWithTime(dateString?: string): string {
  const date = new Date(dateString ?? "now");
  return (
    date
      .toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: WIB_TIME_ZONE,
      })
      .replace("pukul", ",")
      .replaceAll(".", ":") + " WIB"
  );
}

export function formatLongDateWithTime(dateString?: string): string {
  const date = new Date(dateString ?? "now");
  return (
    date
      .toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: WIB_TIME_ZONE,
      })
      .replace("pukul", ",")
      .replaceAll(".", ":") + " WIB"
  );
}

export function formatCurrency(amount: number): string {
  const value = amount ?? 0;
  if (value === 0) return "Rp. 0";

  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(value));

  return value < 0 ? `-${formatted}` : formatted;
}

export const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`;
};

// Helper function to convert date format from DD/MM/YYYY HH:MM:SS to YYYY-MM-DD HH:MM
export function formatDatePattern(dateString: string): string {
  const ddmmyyyyPattern =
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/;
  const match = dateString.match(ddmmyyyyPattern);

  if (match) {
    const day = match[1]!.padStart(2, "0");
    const month = match[2]!.padStart(2, "0");
    const year = match[3]!;
    const hour = match[4]!.padStart(2, "0");
    const minute = match[5]!;
    // Ignore seconds, format is YYYY-MM-DD HH:MM
    return `${year}-${month}-${day} ${hour}:${minute}`;
  }

  // Return as-is if doesn't match pattern
  return dateString;
}

export function formatDateShortText(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: WIB_TIME_ZONE,
  });
}

export function formatYYYMMDDDate(date?: Date): string {
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // getMonth mulai dari 0
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export const calculateDifferenceDays = (
  startDate: string,
  endDate: string,
): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
  return diffDays;
};

export const generateFixPrice = (price: number): number => {
  const remainder = price % 1000;
  if (remainder < 500) {
    return price - remainder;
  } else {
    return price + (1000 - remainder);
  }
};

export const generateRandomId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export const formatStandardNumber = (value: number): string => {
  return value.toLocaleString().replaceAll(",", ".");
};

export async function imageToBase64(url: string): Promise<string> {
  const newUrl = await resizeTo58mm(url);

  const res = await fetch(newUrl);
  const blob = await res.blob();

  return await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

async function resizeTo58mm(url: string): Promise<string> {
  const img = new Image();
  img.src = url;

  await new Promise((r) => (img.onload = r));

  const canvas = document.createElement("canvas");
  const targetWidth = 384;
  const scale = targetWidth / img.width;

  canvas.width = targetWidth;
  canvas.height = Math.round(img.height * scale);

  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/png");
}

export function roundDownToMultiple1000(value: number): number {
  return Math.floor(value / 1000) * 1000;
}

export function formatTitle(text: string): string {
  return text
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function getCookie(key: string): string | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split("; ");

  const found = cookies.find((cookie) => cookie.startsWith(`${key}=`));

  if (!found) return null;

  return decodeURIComponent(found.split("=").slice(1).join("="));
}

export function checkRole(currentRole: string, role: string): boolean {
  if (currentRole.toLowerCase() === role.toLowerCase()) {
    return true;
  }

  return false;
}

export function generateInvoiceNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  const random = crypto.randomBytes(4).toString("hex").toUpperCase();

  return `INV-${date}-${random}`;
}
