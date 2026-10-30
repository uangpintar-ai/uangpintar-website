import HeroSection from "./sections/HeroSection";
import ProblemSection from "./sections/ProblemSection";
import HowItWorksSection from "./sections/HowItWorksSection";
import FeaturesSection from "./sections/FeaturesSection";
import TestimonialsSection from "./sections/TestimonialsSection";
import PricingSection from "./sections/PricingSection";
import FAQSection from "./sections/FAQSection";
import CTASection from "./sections/CTASection";
import { getPlanPrices } from "@/server/services/plan-price";

const LandingPageContainer = () => {
  const prices = getPlanPrices();

  return (
    <>
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <FeaturesSection />
      <TestimonialsSection />
      <PricingSection prices={prices} />
      <CTASection prices={prices} />
      <FAQSection prices={prices} />
    </>
  );
};

export default LandingPageContainer;
