"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { Loader2, Send, ArrowRight } from "lucide-react";

interface Wallet {
    id: string;
    currency: string;
    balance: string;
}

export default function TransferPage() {
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [fromWalletId, setFromWalletId] = useState("");
    const [toWalletId, setToWalletId] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        // Fetch source wallets
        api.get('/api/wallets').then(res => {
            const data = res.data.data;
            setWallets(data);
            if (data.length > 0) setFromWalletId(data[0].id);
        }).catch(err => console.error(err));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            await api.post('/api/transfer', {
                fromWalletId,
                toWalletId,
                amount: Number(amount),
                description,
                referenceId: crypto.randomUUID() // Ensure idempotency
            });

            setSuccess("Transfer successful!");
            setAmount("");
            setDescription("");
            setToWalletId("");

            // Refresh wallet data to show new balance
            setTimeout(() => {
                router.push('/dashboard');
            }, 1500);
        } catch (err: any) {
            setError(err.response?.data?.message || "Transfer failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Transfer Money</h1>
                <p className="text-slate-600 mt-2">Send funds to another wallet securely</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 border-b border-slate-200">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                            <Send className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">New Transfer</h2>
                            <p className="text-sm text-slate-600">Fill in the details below</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg">
                            <p className="font-medium">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg">
                            <p className="font-medium">{success}</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">From Wallet</label>
                        <select
                            value={fromWalletId}
                            onChange={(e) => setFromWalletId(e.target.value)}
                            className="block w-full rounded-xl border border-slate-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 py-3 px-4 transition-all"
                        >
                            {wallets.map(w => (
                                <option key={w.id} value={w.id}>
                                    My {w.currency} Wallet (${Number(w.balance).toLocaleString()})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center justify-center py-2">
                        <ArrowRight className="h-6 w-6 text-slate-400" />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">To Wallet ID</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. wallet-uuid..."
                            value={toWalletId}
                            onChange={(e) => setToWalletId(e.target.value)}
                            className="block w-full rounded-xl border border-slate-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 py-3 px-4 transition-all"
                        />
                        <p className="mt-2 text-sm text-slate-500">Enter the recipient's wallet UUID</p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Amount</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="text-slate-500 text-lg font-semibold">$</span>
                            </div>
                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="block w-full rounded-xl border border-slate-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 py-3 pl-10 pr-4 text-lg transition-all"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                        <input
                            type="text"
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="block w-full rounded-xl border border-slate-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 py-3 px-4 transition-all"
                            placeholder="What's this for?"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center items-center py-3.5 px-6 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-blue-500/30"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Send className="h-5 w-5 mr-2" />
                                Transfer Funds
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
