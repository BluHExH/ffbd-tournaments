"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Trophy,
  Users,
  CreditCard,
  WalletCards,
  Swords,
  Settings2,
  ShieldCheck,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import { AdminLogoutButton } from "./AdminLogoutButton";

const primaryLinks = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/tournaments", label: "Tournaments", icon: Trophy },
];

const managementLinks = [
  { href: "/admin/registrations", label: "Players & Registrations", icon: Users },
  { href: "/admin/payments", label: "Tournament Payments", icon: CreditCard },
  { href: "/admin/wallet", label: "Player Wallet", icon: WalletCards },
  { href: "/admin/matches", label: "Matches & Results", icon: Swords },
  { href: "/admin/settings", label: "Website Settings", icon: Settings2 },
  { href: "/admin/homepage-stats", label: "Homepage Stats", icon: Settings2 },
  { href: "/admin/homepage-teams", label: "Homepage Teams", icon: Trophy },
  { href: "/admin/homepage-payouts", label: "Homepage Payouts", icon: CreditCard },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === "/admin/login" || pathname === "/admin/mfa") {
    return <>{children}</>;
  }

  const sidebar = (
    <>
      <div className="flex h-[72px] items-center gap-3 border-b border-white/[0.08] px-5">
        <Image
          src={BRAND.logo}
          alt={BRAND.name}
          width={42}
          height={42}
          className="h-10 w-10 rounded-xl object-cover ring-1 ring-white/10"
          unoptimized
        />
        <div className="min-w-0">
          <p className="font-heading text-sm font-bold tracking-wide text-white">
            BANGLAR <span className="text-[#FF5C00]">TOURNAMENTS</span>
          </p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
            Control Center
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-6">
        <div>
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
            Workspace
          </p>
          <div className="space-y-1">
            {primaryLinks.map(({ href, label, icon: Icon, exact }) => {
              const active = exact
                ? pathname === href
                : pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all ${
                    active
                      ? "border border-[#FF5C00]/25 bg-[#FF5C00]/10 text-white shadow-[inset_2px_0_0_#FF5C00]"
                      : "text-white/55 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  <Icon className={`h-[18px] w-[18px] ${active ? "text-[#FF7130]" : "text-white/40 group-hover:text-white/80"}`} />
                  {label}
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#FF5C00]" />}
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
            Management
          </p>
          <div className="space-y-1">
            {managementLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all ${active ? "border border-[#FF5C00]/25 bg-[#FF5C00]/10 text-white" : "text-white/55 hover:bg-white/[0.05] hover:text-white"}`}>
                <Icon className={`h-[18px] w-[18px] ${active ? "text-[#FF7130]" : "text-white/40 group-hover:text-white/80"}`} />
                <span>{label}</span>
              </Link>;
            })}
          </div>
        </div>
      </nav>

      <div className="border-t border-white/[0.08] p-3">
        <Link
          href="/"
          target="_blank"
          className="mb-2 flex min-h-10 items-center gap-3 rounded-xl px-3 text-xs font-medium text-white/45 transition hover:bg-white/[0.05] hover:text-white"
        >
          <ExternalLink className="h-4 w-4" />
          View public website
        </Link>
        <div className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#FF5C00]/20 bg-[#FF5C00]/10">
              <ShieldCheck className="h-4 w-4 text-[#FF7130]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white/85">Admin access</p>
              <p className="text-[10px] text-white/35">Protected session</p>
            </div>
          </div>
          <AdminLogoutButton />
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#0B1221] text-white">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-white/[0.08] bg-[#0B1221] lg:flex">
        {sidebar}
      </aside>

      <div className="lg:pl-[264px]">
        <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.08] bg-[#0B1221]/90 px-4 backdrop-blur-xl sm:px-6 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/75"
            aria-label="Open admin navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-heading text-sm font-bold tracking-wide">
            BANGLAR <span className="text-[#FF5C00]">ADMIN</span>
          </span>
          <Link href="/" aria-label="View website" className="text-white/45">
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        <div className="min-h-[calc(100vh-56px)] lg:min-h-screen">{children}</div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <aside className="relative flex h-full w-[min(86vw,300px)] flex-col border-r border-white/10 bg-[#0B1221] shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}
    </div>
  );
}
