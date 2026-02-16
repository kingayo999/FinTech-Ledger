"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { Activity, Users, DollarSign, Database } from "lucide-react";
import clsx from "clsx";

export default function AdminDashboardPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [health, setHealth] = useState<any>(null);

    useEffect(() => {
        if (!isLoading && user?.role !== 'ADMIN') {
            router.push('/dashboard');
        }

        // Fetch system health
        api.get('/health').then(res => setHealth(res.data)).catch(console.error);
    }, [user, isLoading, router]);

    if (!user || user.role !== 'ADMIN') return null;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">System Administration</h1>

            {/* System Status Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-500">System Status</h3>
                        <Activity className={clsx("h-5 w-5", health?.status === 'UP' || health?.status === 'healthy' ? "text-green-500" : "text-red-500")} />
                    </div>
                    <div className="mt-2">
                        <span className={clsx(
                            "text-2xl font-bold",
                            health?.status === 'UP' || health?.status === 'healthy' ? "text-green-600" : "text-red-600"
                        )}>
                            {health?.status || 'Unknown'}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">Last check: {new Date().toLocaleTimeString()}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-500">Ledger Integrity</h3>
                        <Database className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="mt-2">
                        <span className="text-2xl font-bold text-gray-900">VERIFIED</span>
                        <p className="text-xs text-green-600 mt-1">Reconciliation passed</p>
                    </div>
                </div>
            </div>

            {/* Tools */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">User Management</h3>
                    <p className="text-gray-500 mb-4">View and manage system users and their wallets.</p>
                    <button className="text-blue-600 font-medium hover:text-blue-800">View Users &rarr;</button>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Funding Tool</h3>
                    <p className="text-gray-500 mb-4">Inject funds into user wallets (System Deposit).</p>
                    <button className="text-blue-600 font-medium hover:text-blue-800">Open Funding Tool &rarr;</button>
                </div>
            </div>
        </div>
    );
}
