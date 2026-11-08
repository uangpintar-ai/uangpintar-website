import { notFound } from "next/navigation";
import BudgetGate from "@/components/module/user-dashboard/BudgetGate";
import BudgetDetail from "@/components/module/user-dashboard/BudgetDetail";

type Props = {
  params: Promise<{ month: string }>;
};

const page = async ({ params }: Props) => {
  const { month } = await params;

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    notFound();
  }

  return (
    <BudgetGate>
      <BudgetDetail key={month} month={month} />
    </BudgetGate>
  );
};

export default page;
