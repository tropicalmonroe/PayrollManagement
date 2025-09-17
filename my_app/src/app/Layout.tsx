import "./global.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Bounce, ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

export const metadata = {
    title: "Payroll Management System",
    description: "Next.js 15 App",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
return (
    <ClerkProvider>
        <html lang="en">
            <body>
                <ToastContainer position="bottom-right" autoClose={2000} theme="dark" transition={Bounce} />
                {children}
            </body>
        </html>
    </ClerkProvider>
);
}
