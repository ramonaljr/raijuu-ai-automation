import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Raijuu — AI automation that gives your team back hours every week",
  description:
    "One connected system: landing pages, chatbots, ads, CRM follow-ups, and workflow automations. Plans from $299/month.",
  openGraph: {
    title: "Raijuu — AI automation that gives your team back hours every week",
    description:
      "Landing pages that convert. Chatbots that qualify. Ads that book meetings. Workflows that close deals. From $299/month.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen font-sans">
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
