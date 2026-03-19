import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "성경암송대회 암송준비APP",
  description: "성경암송대회 암송준비APP",
  manifest: "/church/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "암송",
    statusBarStyle: "black-translucent",
  },
};

export default function ChurchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
