import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Piggyback — Free delivery when a driver is nearby",
  description:
    "Get notified the moment a delivery driver is dispatched to your neighborhood. Order quickly and skip the delivery fee.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
