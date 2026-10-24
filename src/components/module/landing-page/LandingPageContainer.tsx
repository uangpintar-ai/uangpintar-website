import HeroSection from "./sections/HeroSection";
import ProblemSection from "./sections/ProblemSection";
import HowItWorksSection from "./sections/HowItWorksSection";
import FeaturesSection from "./sections/FeaturesSection";
import TestimonialsSection from "./sections/TestimonialsSection";
import PricingSection from "./sections/PricingSection";
import FAQSection from "./sections/FAQSection";
import CTASection from "./sections/CTASection";

const LandingPageContainer = () => {
  return (
    <>
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <FeaturesSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
      <FAQSection />
    </>
  );
};

export default LandingPageContainer;
