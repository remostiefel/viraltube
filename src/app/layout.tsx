import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/layout/Shell";
import { ActionHistoryProvider } from "@/components/context/ActionHistoryContext";
import { ToastProvider } from "@/components/ui/Toast";
import { HelpProvider } from "@/components/ui/HelpSystem";
import { checkAndRecordDailyProgress } from "@/lib/brain-build";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CORTEX",
  description: "The Creator's Operating System",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await checkAndRecordDailyProgress();

  return (
    <html lang="en" className="dark">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground h-screen flex overflow-hidden`}
      >
        <HelpProvider>
          <ActionHistoryProvider>
            <ToastProvider>
              <Shell>{children}</Shell>
            </ToastProvider>
          </ActionHistoryProvider>
        </HelpProvider>
      </body>
    </html>
  );
}
