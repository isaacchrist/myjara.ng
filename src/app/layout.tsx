import type { Metadata } from "next";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyJara - Discover Products, Enjoy More",
  description: "Nigeria's marketplace where you always get extra. Shop across hundreds of brands and enjoy Jara - bonus products with every qualifying purchase.",
  keywords: ["marketplace", "Nigeria", "shopping", "jara", "bonus", "deals"],
  openGraph: {
    title: "MyJara - Discover Products, Enjoy More",
    description: "Nigeria's marketplace where you always get extra.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="flex min-h-screen flex-col font-sans antialiased"
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          disableTransitionOnChange
        >
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
