import type { Metadata } from "next";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { CartProvider } from "@/context/cart-context";
import { RejectionBanner } from "@/components/shared/rejection-banner";
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
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
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
          <CartProvider>
            <RejectionBanner />
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
            <Toaster />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
