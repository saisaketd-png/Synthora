import { Metadata } from "next";

export const metadata: Metadata = {
  title: "RFQ Workspace | KemKendra",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RFQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
