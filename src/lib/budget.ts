export const MONTH_OPTIONS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export const monthKey = (date: Date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

export const shiftMonth = (month: string, delta: number) => {
  const [year, monthNumber] = month.split("-").map(Number);
  return monthKey(new Date(Date.UTC(year!, monthNumber! - 1 + delta)));
};

export const monthLabel = (month: string) => {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year!, monthNumber! - 1)).toLocaleDateString(
    "id-ID",
    { month: "long", year: "numeric", timeZone: "UTC" },
  );
};

export const monthName = (month: string) => {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year!, monthNumber! - 1)).toLocaleDateString(
    "id-ID",
    { month: "long", timeZone: "UTC" },
  );
};

export const percentOf = (done: number, total: number) =>
  total > 0 ? Math.round((done / total) * 100) : 0;
