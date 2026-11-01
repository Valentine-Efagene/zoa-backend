"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  LayoutDashboard,
  LogOut,
  Plus,
  Shield,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { BrandLogo } from "@/components/brand-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const applicantLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applications", label: "Applications", icon: FileText },
  { href: "/applications/new", label: "New application", icon: Plus },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { session, signOut } = useAuth();
  const isAdmin = Boolean(session?.isAdmin);

  const links = [
    ...applicantLinks,
    ...(isAdmin
      ? [{ href: "/admin", label: "Admin inbox", icon: Shield }]
      : []),
  ];

  return (
    <div className="min-h-full bg-[var(--zoa-canvas)]">
      <header className="border-b border-border/60 bg-background/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link
              href={isAdmin && pathname.startsWith("/admin") ? "/admin" : "/dashboard"}
              className="inline-flex"
            >
              <BrandLogo />
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              {links.map((link) => {
                const active =
                  pathname === link.href ||
                  (link.href !== "/dashboard" &&
                    pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                    )}
                  >
                    <link.icon className="size-3.5 opacity-70" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <Badge variant="secondary" className="hidden sm:inline-flex">
                Admin
              </Badge>
            ) : null}
            <span className="hidden text-sm text-muted-foreground md:inline">
              {session?.name || session?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                signOut();
                window.location.assign("/login");
              }}
            >
              <LogOut className="size-3.5" />
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
