import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register Account | KemKendra Enterprise Portal",
  description: "Create a KemKendra buyer or supplier account for global B2B chemical sourcing.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
