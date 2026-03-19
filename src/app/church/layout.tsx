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
  openGraph: {
    title: "성경암송대회 암송준비APP",
    description: "성경암송대회 암송준비APP",
    url: "https://bible-memorization-tracker.vercel.app/church",
    siteName: "성경암송대회 암송준비APP",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "성경암송대회 암송준비APP",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "성경암송대회 암송준비APP",
    description: "성경암송대회 암송준비APP",
    images: ["/og-image.png"],
  },
};

export default function ChurchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
