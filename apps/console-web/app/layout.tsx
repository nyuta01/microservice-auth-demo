import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { OrganizationProvider } from "@/lib/organization-context";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Console - Organization/Workspace Management",
  description: "Unified management console for Organization/Workspace level",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <OrganizationProvider>
          {children}
        </OrganizationProvider>
      </body>
    </html>
  );
}
