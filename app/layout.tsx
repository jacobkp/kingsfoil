import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { BillProvider } from "@/lib/BillContext";
import BreakpointWarning from "@/components/BreakpointWarning";
import AuthWrapper from "@/components/AuthWrapper";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Medical Bill Analyzer",
  description: "AI-powered medical bill analysis to detect errors and save money",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <BillProvider>
          <BreakpointWarning />
          <AuthWrapper>{children}</AuthWrapper>
        </BillProvider>
      </body>
    </html>
  );
}
