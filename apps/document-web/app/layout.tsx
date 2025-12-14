import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { WorkspaceProvider } from "@repo/web-lib";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Document Manager - Document Management",
  description: "Manage your documents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <WorkspaceProvider>
          {children}
        </WorkspaceProvider>
      </body>
    </html>
  );
}
