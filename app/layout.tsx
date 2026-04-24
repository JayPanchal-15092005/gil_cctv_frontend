import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GIL CCTV Election Portal",
  description: "Real-time CCTV monitoring portal for election operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
