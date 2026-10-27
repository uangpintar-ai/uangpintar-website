import type { IconType } from "react-icons";
import {
  PiAirplane,
  PiBaby,
  PiBank,
  PiBarbell,
  PiBeerBottle,
  PiBicycle,
  PiBook,
  PiBriefcase,
  PiChartLine,
  PiBus,
  PiCar,
  PiCoffee,
  PiDeviceMobile,
  PiDotsThree,
  PiFilmStrip,
  PiFirstAid,
  PiForkKnife,
  PiGameController,
  PiGasPump,
  PiGift,
  PiGraduationCap,
  PiHeartbeat,
  PiHouse,
  PiLightning,
  PiMoney,
  PiMotorcycle,
  PiMusicNote,
  PiPackage,
  PiPawPrint,
  PiPiggyBank,
  PiPizza,
  PiReceipt,
  PiScissors,
  PiShoppingCart,
  PiStorefront,
  PiTShirt,
  PiTag,
  PiTaxi,
  PiTrain,
  PiVan,
  PiWallet,
  PiWifiHigh,
  PiWrench,
} from "react-icons/pi";

export const DEFAULT_CATEGORY_ICON = "PiDotsThree";

export const TRANSACTION_CATEGORY_ICONS: {
  value: string;
  label: string;
  Icon: IconType;
}[] = [
  { value: "PiDotsThree", label: "Lainnya", Icon: PiDotsThree },
  { value: "PiForkKnife", label: "Makanan", Icon: PiForkKnife },
  { value: "PiCoffee", label: "Minuman", Icon: PiCoffee },
  { value: "PiPizza", label: "Jajanan", Icon: PiPizza },
  { value: "PiBeerBottle", label: "Minuman Kemasan", Icon: PiBeerBottle },
  { value: "PiShoppingCart", label: "Belanja", Icon: PiShoppingCart },
  { value: "PiTShirt", label: "Pakaian", Icon: PiTShirt },
  { value: "PiScissors", label: "Perawatan", Icon: PiScissors },
  { value: "PiCar", label: "Mobil", Icon: PiCar },
  { value: "PiMotorcycle", label: "Motor", Icon: PiMotorcycle },
  { value: "PiTaxi", label: "Transportasi", Icon: PiTaxi },
  { value: "PiBus", label: "Bus", Icon: PiBus },
  { value: "PiTrain", label: "Kereta", Icon: PiTrain },
  { value: "PiAirplane", label: "Pesawat", Icon: PiAirplane },
  { value: "PiGasPump", label: "Bensin", Icon: PiGasPump },
  { value: "PiBicycle", label: "Sepeda", Icon: PiBicycle },
  { value: "PiVan", label: "Kendaraan", Icon: PiVan },
  { value: "PiHouse", label: "Rumah", Icon: PiHouse },
  { value: "PiLightning", label: "Listrik", Icon: PiLightning },
  { value: "PiWifiHigh", label: "Internet", Icon: PiWifiHigh },
  { value: "PiDeviceMobile", label: "Pulsa", Icon: PiDeviceMobile },
  { value: "PiHeartbeat", label: "Kesehatan", Icon: PiHeartbeat },
  { value: "PiFirstAid", label: "Obat", Icon: PiFirstAid },
  { value: "PiBarbell", label: "Olahraga", Icon: PiBarbell },
  { value: "PiGraduationCap", label: "Pendidikan", Icon: PiGraduationCap },
  { value: "PiBook", label: "Buku", Icon: PiBook },
  { value: "PiGameController", label: "Game", Icon: PiGameController },
  { value: "PiFilmStrip", label: "Hiburan", Icon: PiFilmStrip },
  { value: "PiMusicNote", label: "Musik", Icon: PiMusicNote },
  { value: "PiGift", label: "Hadiah", Icon: PiGift },
  { value: "PiPawPrint", label: "Hewan", Icon: PiPawPrint },
  { value: "PiBaby", label: "Anak", Icon: PiBaby },
  { value: "PiBriefcase", label: "Pekerjaan", Icon: PiBriefcase },
  { value: "PiBank", label: "Bank", Icon: PiBank },
  { value: "PiWallet", label: "Dompet", Icon: PiWallet },
  { value: "PiReceipt", label: "Tagihan", Icon: PiReceipt },
  { value: "PiPiggyBank", label: "Tabungan", Icon: PiPiggyBank },
  { value: "PiChartLine", label: "Investasi", Icon: PiChartLine },
  { value: "PiMoney", label: "Pemasukan", Icon: PiMoney },
  { value: "PiPackage", label: "Paket", Icon: PiPackage },
  { value: "PiStorefront", label: "Toko", Icon: PiStorefront },
  { value: "PiWrench", label: "Perbaikan", Icon: PiWrench },
  { value: "PiTag", label: "Umum", Icon: PiTag },
];

export const getTransactionCategoryIcon = (icon?: string | null) =>
  TRANSACTION_CATEGORY_ICONS.find((item) => item.value === icon)?.Icon ??
  PiDotsThree;

export const TransactionCategoryIcon = ({
  icon,
  className,
}: {
  icon?: string | null;
  className?: string;
}) => {
  const Icon = getTransactionCategoryIcon(icon);
  return <Icon className={className} />;
};
