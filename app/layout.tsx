import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/app/theme-provider";

export const metadata: Metadata = {
  title: "RNMCOM — School Connected",
  description: "A unified school management and communication workspace.",
  applicationName: "RNMCOM",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f8fc",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body><ThemeProvider>{children}</ThemeProvider></body>
    </html>
  );
}