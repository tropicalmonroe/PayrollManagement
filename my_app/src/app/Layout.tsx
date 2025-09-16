import "./styles/globals.css";

export const metadata = {
    title: "Payroll Management System",
    description: "Next.js 15 App",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
return (
    <html lang="en">
    <body>
        {children}
    </body>
    </html>
);
}
