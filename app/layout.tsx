import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LMS Pesantren",
  description: "Sistem Manajemen Pembelajaran",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}