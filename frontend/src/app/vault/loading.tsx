"use client";

import { useEffect, useState } from "react";

export default function VaultLoading() {
  const [offline, setOffline] = useState(
    () => typeof navigator !== "undefined" && navigator.onLine === false,
  );

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (offline) {
    return (
      <section className="min-h-full bg-bg-primary px-6 py-8 lg:px-10">
        <div
          role="alert"
          className="max-w-7xl mx-auto rounded-lg border border-status-danger/20 bg-status-danger/10 px-4 py-5 text-center"
        >
          <p className="text-sm text-status-danger">
            You&apos;re offline. Vault balances will load when your connection returns.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 rounded-lg border border-border-default px-4 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-full bg-bg-primary px-6 py-8 lg:px-10 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="h-20 rounded-2xl border border-border-default bg-card" />
        <div className="h-32 rounded-2xl border border-border-default bg-card" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-64 rounded-2xl border border-border-default bg-card" />
          <div className="h-64 rounded-2xl border border-border-default bg-card" />

          <div className="md:col-span-2 h-80 rounded-2xl border border-border-default bg-card" />
          <div className="h-80 rounded-2xl border border-border-default bg-card" />

          <div className="md:col-span-2 lg:col-span-3 h-32 rounded-2xl border border-border-default bg-card" />
        </div>

        <div className="h-20 rounded-2xl border border-border-default bg-card" />
      </div>
    </section>
  );
}
