"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
    LayoutDashboard,
    Send,
    History,
    ShieldCheck,
    LogOut,
    Wallet
} from "lucide-react";
import clsx from "clsx";

export function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const links = [
        { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
        { href: "/transfer", label: "Transfer Money", icon: Send },
        { href: "/transactions", label: "History", icon: History },
    ];

    if (user?.role === 'ADMIN') {
        links.push({ href: "/admin", label: "Admin Portal", icon: ShieldCheck });
    }

    return (
        <div className="flex h-full flex-col bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700 shadow-2xl">
            <div className="flex h-16 items-center px-6 border-b border-slate-700 bg-slate-900/50">
                <div className="w-10 h-10 rounded-lg overflow-hidden mr-3 flex items-center justify-center bg-white">
                    <Image src="/logo.jpeg" alt="FinTech Ledger" width={60} height={60} className="object-cover scale-150" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">FinTech Ledger</span>
            </div>

            <div className="flex-1 flex flex-col justify-between p-4">
                <nav className="space-y-1">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={clsx(
                                    "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                                    isActive
                                        ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 shadow-lg shadow-amber-500/50"
                                        : "text-amber-200 hover:bg-slate-700/50 hover:text-amber-100"
                                )}
                            >
                                <Icon className="mr-3 h-5 w-5" />
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-slate-700 pt-4">
                    <div className="px-4 py-3 bg-slate-700/30 rounded-xl mb-3">
                        <p className="text-sm font-medium text-amber-100">{user?.email}</p>
                        <p className="text-xs text-amber-200/70 capitalize mt-1 flex items-center">
                            <span className="inline-block w-2 h-2 bg-amber-400 rounded-full mr-2"></span>
                            {user?.role}
                        </p>
                    </div>
                    <button
                        onClick={logout}
                        className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-red-300 rounded-xl hover:bg-red-500/10 hover:text-red-200 transition-all duration-200"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Sign out
                    </button>
                </div>
            </div>
        </div>
    );
}
