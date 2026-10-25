const packageLabels: Record<string, string> = {
  UNVERIFIED: "Belum Terverifikasi",
  GRATIS: "Gratis",
  PEMULA_BULANAN: "Pemula Bulanan",
  PEMULA_TAHUNAN: "Pemula Tahunan",
  PAKET_JAGO: "Paket Jago",
  INACTIVE: "Tidak Aktif",
  SUSPENDED: "Ditangguhkan",
};

export const getPackageLabel = (status?: string | null) =>
  status ? (packageLabels[status] ?? status) : "-";
