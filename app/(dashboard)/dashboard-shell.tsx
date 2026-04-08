"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  FileText,
  Users,
  BarChart3,
  Settings,
  Menu,
  LogOut,
  ChevronDown,
  Target,
  Bell,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";

interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  link: string | null
  created_at: string
}

interface DashboardShellProps {
  user: { email: string; name: string };
  notifications?: Notification[];
  children: React.ReactNode;
}

export function DashboardShell({ user, notifications = [], children }: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, locale, setLocale, dir } = useI18n();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const navLinks = [
    { href: "/dashboard", label: t.dashboard, icon: LayoutDashboard },
    { href: "/dashboard/transactions", label: t.transactions, icon: ArrowLeftRight },
    { href: "/dashboard/invoices", label: t.invoices, icon: FileText },
    { href: "/dashboard/clients", label: t.clients, icon: Users },
    { href: "/dashboard/goals", label: t.goals, icon: Target },
    { href: "/dashboard/budgets", label: t.budgets, icon: Wallet },
    { href: "/dashboard/subscriptions", label: t.subscriptionsPage, icon: Bell },
    { href: "/dashboard/reports", label: t.reports, icon: BarChart3 },
    { href: "/dashboard/settings", label: t.settings, icon: Settings },
  ];

  const pageTitles: Record<string, string> = {
    "/dashboard": t.dashboard,
    "/dashboard/transactions": t.transactions,
    "/dashboard/invoices": t.invoices,
    "/dashboard/clients": t.clients,
    "/dashboard/goals": t.goals,
    "/dashboard/budgets": t.budgets,
    "/dashboard/subscriptions": t.subscriptionsPage,
    "/dashboard/reports": t.reports,
    "/dashboard/settings": t.settings,
  };

  const pageTitle = pageTitles[pathname] ?? t.dashboard;

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-[#070b14]" dir={dir}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 bg-[#0a0f1a]/80 backdrop-blur-xl border-s border-white/[0.06]">
        <SidebarContent
          pathname={pathname}
          user={user}
          initials={initials}
          navLinks={navLinks}
          t={t}
          dir={dir}
        />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="right"
          className="w-64 p-0 bg-[#0a0f1a] border-s border-white/[0.06]"
        >
          <SheetTitle className="sr-only">{t.menu}</SheetTitle>
          <SidebarContent
            pathname={pathname}
            user={user}
            initials={initials}
            navLinks={navLinks}
            t={t}
            dir={dir}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>

        {/* Main Content */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Top Header — clean, minimal */}
          <header className="flex items-center gap-3 h-14 px-4 md:px-8 border-b border-white/[0.04] bg-[#070b14]/60 backdrop-blur-md">
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.04]"
              >
                <Menu className="size-5" />
                <span className="sr-only">{t.menu}</span>
              </Button>
            </SheetTrigger>
            <h1 className="text-sm font-medium text-[#94a3b8] tracking-wide">
              {pageTitle}
            </h1>
            <div className="flex items-center gap-2 ms-auto">
              {/* Notification bell */}
              <DropdownMenu dir={dir}>
                <DropdownMenuTrigger asChild>
                  <button className="relative size-9 rounded-xl flex items-center justify-center text-[#64748b] hover:text-[#e2e8f0] hover:bg-white/[0.04] transition-all">
                    <Bell className="size-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -end-0.5 size-4 rounded-full bg-[#ef4444] text-white text-[9px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-0 bg-[#0a0f1a] border-white/[0.08] rounded-xl">
                  <div className="p-3 border-b border-white/[0.06]">
                    <p className="text-xs font-semibold text-[#e2e8f0]">
                      {t.notifications}
                    </p>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-[#64748b] text-center py-8">
                      {t.noNotifications}
                    </p>
                  ) : (
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.slice(0, 8).map((n) => {
                        const colors: Record<string, string> = { danger: "#ef4444", warning: "#f59e0b", success: "#10b981", info: "#3b82f6" }
                        const color = colors[n.type] ?? "#3b82f6"
                        return (
                          <DropdownMenuItem key={n.id} asChild className="p-0 focus:bg-white/[0.03]">
                            <a href={n.link ?? "#"} className={`flex items-start gap-2.5 px-3 py-3 ${!n.is_read ? "bg-white/[0.02]" : ""}`}>
                              <span className="size-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: color }} />
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-[#e2e8f0] truncate">{n.title}</p>
                                <p className="text-[10px] text-[#64748b] mt-0.5 line-clamp-2">{n.message}</p>
                              </div>
                            </a>
                          </DropdownMenuItem>
                        )
                      })}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Language toggle */}
              <button onClick={() => setLocale(locale === "ar" ? "en" : "ar")} className="text-xs text-[#475569] hover:text-[#94a3b8] rounded-full px-3 py-1 border border-white/[0.06] hover:border-white/[0.12] bg-white/[0.02] transition-all duration-300">
                {t.toggleLang}
              </button>
            </div>
          </header>

          {/* Page Content — generous padding */}
          <main className="flex-1 overflow-y-auto p-5 md:p-10">
            <div className="safi-page-enter">
              {children}
            </div>
          </main>
        </div>
      </Sheet>
    </div>
  );
}

function SidebarContent({
  pathname,
  user,
  initials,
  navLinks,
  t,
  dir,
  onNavigate,
}: {
  pathname: string;
  user: { email: string; name: string };
  initials: string;
  navLinks: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
  t: { logout: string; [key: string]: string };
  dir: "rtl" | "ltr";
  onNavigate?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center py-5 px-5 border-b border-white/[0.04]">
        <img
          src={dir === "rtl" ? "/Logo AR.png" : "/Logo EN.png"}
          alt="Safi"
          className="h-[28px] brightness-0 invert"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium",
                isActive
                  ? "safi-nav-active rounded-xl"
                  : "text-[#64748b] hover:text-[#94a3b8] hover:bg-white/[0.04] rounded-xl transition-all duration-200"
              )}
            >
              <Icon className="size-[18px] shrink-0" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-3 pb-4 pt-4 relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-white/[0.08] to-transparent" />
        <DropdownMenu dir={dir}>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#94a3b8] hover:bg-white/[0.04] transition-colors cursor-pointer">
              <div className="size-9 rounded-full bg-[#3b82f6]/20 text-[#3b82f6] flex items-center justify-center text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="flex-1 text-start min-w-0">
                <p className="text-[#e2e8f0] truncate text-sm font-medium leading-tight">
                  {user.name}
                </p>
                <p className="text-[#64748b] truncate text-xs leading-tight">
                  {user.email}
                </p>
              </div>
              <ChevronDown className="size-4 shrink-0 text-[#64748b]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem asChild>
              <form action="/auth/signout" method="post">
                <button type="submit" className="flex w-full items-center gap-2 text-sm">
                  <LogOut className="size-4" />
                  <span>{t.logout}</span>
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
