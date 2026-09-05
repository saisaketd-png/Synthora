import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Supplier Onboarding Registration | KemKendra",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SupplierRegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
