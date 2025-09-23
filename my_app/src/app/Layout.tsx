import type { Metadata } from "next";
import localFont from "next/font/local";
import "./global.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Bounce, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
    title: "Payroll Management System",
    description: "Next.js 15 App",
};

export default function RootLayout({
children,
}: Readonly<{
children: React.ReactNode;
}>) {
return (
    <ClerkProvider>
        <ToastContainer position="bottom-right" autoClose={2000} theme="dark" transition={Bounce} />
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <ToastContainer position="bottom-right" autoClose={2000} theme="dark" transition={Bounce} />
                {children}
            </body>
        </html>
    </ClerkProvider>
);
}
