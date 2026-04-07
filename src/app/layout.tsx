import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UniGuide",
  description: "選挙管理委員会向け業務遂行支援ツール",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-slate-50">
        {children}
      </body>
    </html>
  );
}
