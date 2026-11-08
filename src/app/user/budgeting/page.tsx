import BudgetGate from "@/components/module/user-dashboard/BudgetGate";
import BudgetOverview from "@/components/module/user-dashboard/BudgetOverview";

const page = () => {
  return (
    <BudgetGate>
      <BudgetOverview />
    </BudgetGate>
  );
};

export default page;
