import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | KemKendra Enterprise Portal",
  description: "Sign in to access your KemKendra buyer or supplier account.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
