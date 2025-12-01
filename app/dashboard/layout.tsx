"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { getBuyerProfile, type BuyerProfile } from "@/lib/store"
import { FileText, BarChart3, Settings, Menu, X, Plus, Building2 } from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "RFQs", icon: FileText },
  { href: "/dashboard/market-prices", label: "Market Prices", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<BuyerProfile | null>(null)

  useEffect(() => {
    setProfile(getBuyerProfile())
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="font-semibold text-foreground">RFQ Manager</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-40 transition-transform duration-200",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-border">
            <div className="flex items-center gap-3">
              <Building2 className="h-7 w-7 text-primary" />
              <div>
                <div className="font-semibold text-foreground text-sm">RFQ Manager</div>
                <div className="text-xs text-muted-foreground">{profile?.companyName}</div>
              </div>
            </div>
            <div className="hidden lg:block">
              <ThemeToggle />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href)) ||
                (item.href === "/dashboard" && (pathname === "/dashboard" || pathname.startsWith("/dashboard/rfq")))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Create RFQ Button */}
          <div className="p-4 border-t border-border">
            <Link href="/dashboard/rfq/new">
              <Button className="w-full" onClick={() => setSidebarOpen(false)}>
                <Plus className="h-4 w-4 mr-2" />
                Create New RFQ
              </Button>
            </Link>
          </div>

          {/* User info */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">{profile?.buyerName?.charAt(0) || "A"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{profile?.buyerName || "Admin"}</div>
                <div className="text-xs text-muted-foreground truncate">{profile?.email || "admin@company.com"}</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">{children}</main>
    </div>
  )
}
