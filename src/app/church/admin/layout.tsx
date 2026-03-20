import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "암송 관리자",
  manifest: "/church/admin/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "암송 관리",
    statusBarStyle: "black-translucent",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
