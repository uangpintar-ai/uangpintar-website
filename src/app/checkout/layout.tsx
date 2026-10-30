import AuthUserLayout from "@/components/module/auth/user/AuthUserLayout";

type Props = {
  children: React.ReactNode;
};

const layout = ({ children }: Props) => {
  return <AuthUserLayout hideAside>{children}</AuthUserLayout>;
};

export default layout;
