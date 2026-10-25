import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth/auth-options";
import { db } from "@/server/db";
import { isPlanId, type PlanId } from "@/const/payment";
import UpgradePlans from "@/components/module/upgrade/UpgradePlans";

type Props = {
  searchParams: Promise<{ plan?: string }>;
};

const allPlans: PlanId[] = ["pemula_monthly", "pemula_yearly", "jago_lifetime"];

const UpgradePage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const planParam = params.plan;

  const session = await getServerSession(authOptions);
  const userId = session?.user.userId;

  if (!userId) {
    redirect(
      `/login?redirect=${encodeURIComponent(
        `/user/upgrade${isPlanId(planParam) ? `?plan=${planParam}` : ""}`,
      )}`,
    );
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      packageRnd: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const latestPaid = await db.payment.findFirst({
    where: { userId, status: "PAID" },
    orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
    select: { plan: true },
  });

  const activePlan =
    latestPaid && isPlanId(latestPaid.plan) ? latestPaid.plan : null;
  const active = user.packageRnd.getTime() > Date.now();

  let availablePlans = allPlans;

  if (active && activePlan) {
    if (activePlan === "pemula_monthly") {
      availablePlans = ["pemula_yearly", "jago_lifetime"];
    } else if (activePlan === "pemula_yearly") {
      availablePlans = ["jago_lifetime"];
    } else {
      availablePlans = [];
    }
  }

  const requested = isPlanId(planParam) ? planParam : null;
  const initialPlan =
    requested && availablePlans.includes(requested) ? requested : null;

  return (
    <UpgradePlans
      initialPlan={initialPlan}
      availablePlans={availablePlans}
      activePlan={active ? activePlan : null}
      name={`${user.firstName} ${user.lastName}`.trim()}
      email={user.email}
    />
  );
};

export default UpgradePage;
