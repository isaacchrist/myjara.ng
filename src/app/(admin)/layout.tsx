import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
    title: "MyJara Admin",
    description: "Administrative dashboard for MyJara platform",
};

export default function AdminRootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // This layout replaces the root layout for admin routes
    // No Header, No Footer - completely isolated admin experience
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="font-sans antialiased">
                {children}
            </body>
        </html>
    );
}
