"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { format } from "date-fns";
import { ArrowUpRight, ArrowDownLeft, DollarSign, Send, History } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

interface Wallet {
    id: string;
    currency: string;
    balance: string;
}

interface Transaction {
    id: string;
    type: 'CREDIT' | 'DEBIT';
    amount: string;
    description: string;
    status: string;
    createdAt: string;
    counterparty?: string;
}

export default function DashboardPage() {
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch wallets
                const walletRes = await api.get('/api/wallets');
                const userWallets = walletRes.data.data;
                setWallets(userWallets);

                // Fetch recent transactions for the first wallet
                if (userWallets.length > 0) {
                    const txRes = await api.get(`/api/wallets/${userWallets[0].id}/transactions?limit=10`);
                    setTransactions(txRes.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-lg text-slate-600">Loading dashboard...</div></div>;

    return (
        <div className="space-y-8 p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Welcome Back</h1>
                    <p className="text-slate-600 mt-1">Here's your financial overview</p>
                </div>
            </div>

            {/* Wallet Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {wallets.map((wallet) => (
                    <div key={wallet.id} className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                    <DollarSign className="h-5 w-5 text-white" />
                                </div>
                                <h3 className="text-sm font-semibold text-slate-700">{wallet.currency} Wallet</h3>
                            </div>
                        </div>
                        <div className="mt-2">
                            <div className="flex items-baseline space-x-2">
                                <span className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                    {wallet.currency === 'USD' && '$'}
                                    {wallet.currency === 'EUR' && '€'}
                                    {wallet.currency === 'GBP' && '£'}
                                    {wallet.currency === 'JPY' && '¥'}
                                    {Number(wallet.balance).toLocaleString()}
                                </span>
                                <span className="text-sm font-medium text-slate-500">{wallet.currency}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Create Wallet Card */}
                <Link
                    href="/wallets/create"
                    className="group bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-2xl border-2 border-dashed border-blue-300 hover:border-blue-500 hover:from-blue-100 hover:to-cyan-100 transition-all duration-300 flex flex-col items-center justify-center min-h-[180px] cursor-pointer"
                >
                    <div className="w-12 h-12 rounded-xl bg-blue-500 group-hover:bg-blue-600 flex items-center justify-center mb-3 transition-colors">
                        <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-blue-700 group-hover:text-blue-800">
                        Create New Wallet
                    </span>
                    <span className="text-xs text-blue-600 mt-1">Add another currency</span>
                </Link>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 rounded-2xl shadow-xl shadow-blue-500/30">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                    <Link
                        href="/transfer"
                        className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-center py-3 rounded-xl text-sm font-medium text-white transition-all duration-200 border border-white/20 hover:border-white/40 flex flex-col items-center"
                    >
                        <Send className="h-5 w-5 mb-1" />
                        Send Money
                    </Link>
                    <button
                        onClick={() => window.open('https://github.com/kingayo999/FinTech-Ledger#funding', '_blank')}
                        className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-center py-3 rounded-xl text-sm font-medium text-white transition-all duration-200 border border-white/20 hover:border-white/40 flex flex-col items-center"
                    >
                        <DollarSign className="h-5 w-5 mb-1" />
                        Funding Guide
                    </button>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-transparent">
                    <h3 className="text-xl font-bold text-slate-900">Recent Activity</h3>
                    <p className="text-sm text-slate-600 mt-1">Your latest transactions</p>
                </div>
                <div className="divide-y divide-slate-100">
                    {transactions.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <History className="h-8 w-8 text-slate-400" />
                            </div>
                            <p className="text-slate-500 font-medium">No recent transactions found</p>
                            <p className="text-sm text-slate-400 mt-1">Your transaction history will appear here</p>
                        </div>
                    ) : (
                        transactions.map((tx) => (
                            <div key={tx.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={clsx(
                                        "p-3 rounded-xl",
                                        tx.type === 'CREDIT' ? "bg-green-100" : "bg-orange-100"
                                    )}>
                                        {tx.type === 'CREDIT' ?
                                            <ArrowDownLeft className="h-5 w-5 text-green-600" /> :
                                            <ArrowUpRight className="h-5 w-5 text-orange-600" />
                                        }
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">{tx.description}</p>
                                        <p className="text-sm text-slate-500">{format(new Date(tx.createdAt), 'MMM d, yyyy h:mm a')}</p>
                                    </div>
                                </div>
                                <span className={clsx(
                                    "font-bold text-lg",
                                    tx.type === 'CREDIT' ? "text-green-600" : "text-slate-900"
                                )}>
                                    {tx.type === 'CREDIT' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
