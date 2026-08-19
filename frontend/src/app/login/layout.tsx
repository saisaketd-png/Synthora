import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Synthora Enterprise Portal",
  description: "Sign in to access your Synthora buyer or supplier account.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
