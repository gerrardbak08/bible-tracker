import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://bible-memorization-tracker.vercel.app"),
  title: {
    default: "성경 암송 트래커",
    template: "%s | 성경 암송 트래커",
  },
  description: "암송 진도를 체크하고 팀원별 필수 구절을 관리하는 성경 암송 대회 준비 앱",
  applicationName: "성경암송",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "암송",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    title: "성경 암송 트래커",
    description: "팀원별 필수 구절과 전체 암송 진도를 한눈에 확인하세요.",
    url: "https://bible-memorization-tracker.vercel.app",
    siteName: "Bible Memorization Tracker",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Bible Memorization Tracker",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "성경 암송 트래커",
    description: "팀원별 필수 구절과 전체 암송 진도를 한눈에 확인하세요.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
