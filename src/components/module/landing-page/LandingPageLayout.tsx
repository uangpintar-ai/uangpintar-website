import LandingPageHeader from "./LandingPageHeader";
import LandingPageFooter from "./LandingPageFooter";
import RevealObserver from "./RevealObserver";
import "./landing.css";

type Props = {
  children: React.ReactNode;
};

const LandingPageLayout = ({ children }: Props) => {
  return (
    <div className="up-landing">
      <LandingPageHeader />
      <main>{children}</main>
      <LandingPageFooter />
      <RevealObserver />
    </div>
  );
};

export default LandingPageLayout;
