"use client";

import { useState } from "react";
import { FaSchool } from "react-icons/fa6";
import { IoNavigateCircle } from "react-icons/io5";
import { TbInvoice, TbPigMoney } from "react-icons/tb";
import { IoMdCloseCircle } from "react-icons/io";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";

export default function AppNavigator() {
const [open, setOpen] = useState(false);
const { signOut } = useClerk();

const buttons = [
    { icon: <TbPigMoney size={20} />, label: "Payroll App", color: "bg-sky-100", textColor: "text-sky-500", href: "/finance" },
    { icon: <TbInvoice size={20} />, label: "Invoice App", color: "bg-green-100", textColor: "text-green-500", href: "/invoice" },
    { icon: <FaSchool size={20} />, label: "School App", color: "bg-purple-100", textColor: "text-purple-500", href: "/school" },
];

const handleNavigate = async (href: string) => {
    try {
    // 🧹 Clear localStorage/session data
    localStorage.clear();
    sessionStorage.clear();

    // 🚪 Sign out from Clerk
    await signOut();

    // 🔄 Redirect to the target app login
    window.location.href = href;
    } catch (err) {
    console.error("Error during navigation:", err);
    }
};

return (
    <div className="relative flex items-center gap-1">
    {!open ? (
        <button
        onClick={() => setOpen(true)}
        className="px-3 py-2 text-sm font-medium rounded-md bg-[#0f372f] 
        text-[#f5deb3] hover:bg-[#ecbc6b] hover:text-[#0f372f] cursor-pointer transition-colors duration-300"
        >
        <div className="flex items-center justify-center">
        <IoNavigateCircle size={20} className="mr-2" />
        <span>Navigate Apps</span>
        </div>
        </button>
    ) : (
        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
        {buttons.map((btn, i) => (
            <Link
            key={i}
            href={btn.href}
            title={btn.label}
            target="_blank"
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${btn.textColor} ${btn.color} scale-90 hover:scale-100 transition duration-300`}
            onClick={async (e) => {
                e.preventDefault();
                await handleNavigate(btn.href);
            }}
            >
            {btn.icon}
            </Link>
        ))}

        {/* Close button */}
        <button
            onClick={() => setOpen(false)}
            className="w-10 h-10 rounded-lg flex items-center justify-center bg-rose-500 text-rose-100 scale-90 cursor-pointer hover:scale-100 transition-all duration-300"
            title="Close"
        >
            <IoMdCloseCircle size={20} />
        </button>
        </div>
    )}
    </div>
);
}
