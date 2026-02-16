import Link from "next/link";
import { Wallet, ShieldCheck, Zap, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Navigation */}
      <header className="flex h-20 items-center justify-between border-b px-6 lg:px-12">
        <div className="flex items-center gap-2">
          <Wallet className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">FinTech Ledger</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Sign up
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center space-y-10 py-24 px-6 text-center lg:py-32">
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
              Secure Financial Ledger <br className="hidden sm:block" />
              <span className="text-blue-600">Built for Integrity</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              A double-entry bookkeeping system with immutable audit trails,
              real-time reconciliation, and bank-grade security.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:scale-105"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-gray-100 px-8 py-4 text-base font-semibold text-gray-900 hover:bg-gray-200 transition-all"
            >
              Access Dashboard
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="bg-gray-50 py-24 px-6 lg:px-12">
          <div className="mx-auto grid max-w-6xl gap-12 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <div className="mb-4 inline-block rounded-lg bg-blue-100 p-3">
                <ShieldCheck className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Double-Entry Core</h3>
              <p className="mt-2 text-gray-600">
                Every transaction is recorded with balanced debits and credits, ensuring mathematical proof of integrity.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <div className="mb-4 inline-block rounded-lg bg-green-100 p-3">
                <Wallet className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Secure Wallets</h3>
              <p className="mt-2 text-gray-600">
                Managed wallet balances with concurrency controls and protection against negative balances.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <div className="mb-4 inline-block rounded-lg bg-purple-100 p-3">
                <Zap className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Real-Time Sync</h3>
              <p className="mt-2 text-gray-600">
                Immediate processing with background reconciliation jobs to verify system health daily.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} FinTech Ledger System. All rights reserved.</p>
      </footer>
    </div>
  );
}
