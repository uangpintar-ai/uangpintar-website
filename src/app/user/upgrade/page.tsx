import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth/auth-options";
import { db } from "@/server/db";
import { isPlanId } from "@/const/payment";
import UpgradePlans from "@/components/module/upgrade/UpgradePlans";

type Props = {
  searchParams: Promise<{ plan?: string }>;
};

const UpgradePage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const planParam = params.plan;
  const initialPlan = isPlanId(planParam) ? planParam : "pemula_monthly";

  const session = await getServerSession(authOptions);
  const userId = session?.user.userId;

  if (!userId) {
    redirect(
      `/login?redirect=${encodeURIComponent(
        `/user/upgrade?plan=${initialPlan}`,
      )}`,
    );
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, firstName: true, lastName: true },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <UpgradePlans
      initialPlan={initialPlan}
      name={`${user.firstName} ${user.lastName}`.trim()}
      email={user.email}
    />
  );
};

export default UpgradePage;
