"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    ShoppingBag,
    Package,
    Settings,
    LogOut,
    Menu,
    X,
    Users,
    TrendingUp,
    Shield,
    Store,
    ShoppingCart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface DashboardLayoutProps {
    children: React.ReactNode;
    role: "buyer" | "seller" | "admin";
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const pathname = usePathname();

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const navItems = {
        buyer: [
            { href: "/dashboard/buyer", label: "Dashboard", icon: LayoutDashboard },
            { href: "/dashboard/buyer?tab=items", label: "Browse Items", icon: ShoppingBag },
            { href: "/dashboard/buyer?tab=orders", label: "My Orders", icon: Package },
            { href: "/dashboard/buyer?tab=bids", label: "Bids", icon: TrendingUp },
        ],
        seller: [
            { href: "/dashboard/seller", label: "Dashboard", icon: LayoutDashboard },
            { href: "/dashboard/seller?tab=orders", label: "Buyer Orders", icon: ShoppingCart },
            { href: "/dashboard/seller?tab=mybids", label: "My Bids", icon: TrendingUp },
        ],
        admin: [
            { href: "/dashboard/admin", label: "Overview", icon: Shield },
            { href: "/dashboard/admin?tab=items", label: "Manage Items", icon: Package },
            { href: "/dashboard/admin?tab=orders", label: "Manage Orders", icon: ShoppingCart },
            { href: "/dashboard/admin?tab=users", label: "Users", icon: Users },
        ],
    };

    const currentNavItems = navItems[role];

    const getRoleColor = () => {
        switch (role) {
            case "buyer": return "text-purple-600";
            case "seller": return "text-emerald-600";
            case "admin": return "text-rose-600";
            default: return "text-gray-600";
        }
    };

    const getRoleGradient = () => {
        switch (role) {
            case "buyer": return "from-purple-600 to-blue-600";
            case "seller": return "from-emerald-600 to-teal-600";
            case "admin": return "from-rose-600 to-orange-600";
            default: return "from-gray-600 to-gray-800";
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 flex">
            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 ease-in-out",
                    !isSidebarOpen && "-translate-x-full"
                )}
            >
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800">
                        <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${getRoleGradient()} flex items-center justify-center mr-3`}>
                            {role === 'buyer' && <ShoppingBag className="h-5 w-5 text-white" />}
                            {role === 'seller' && <Store className="h-5 w-5 text-white" />}
                            {role === 'admin' && <Shield className="h-5 w-5 text-white" />}
                        </div>
                        <span className="font-bold text-xl tracking-tight">MarketPlace</span>
                    </div>

                    {/* Nav Items */}
                    <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                        <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Menu
                        </div>
                        {currentNavItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                                    pathname === item.href || (pathname === item.href.split('?')[0] && !item.href.includes('?'))
                                        ? `bg-gray-100 dark:bg-gray-800 ${getRoleColor()}`
                                        : "text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                                )}
                            >
                                <item.icon className={cn("h-5 w-5 mr-3",
                                    pathname === item.href ? getRoleColor() : "text-gray-400 group-hover:text-gray-500"
                                )} />
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    {/* User Profile */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-3 mb-4">
                            <Avatar>
                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${role}`} />
                                <AvatarFallback>{role[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate capitalize">
                                    {role} User
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {role}@example.com
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20">
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className={cn(
                "flex-1 flex flex-col min-h-screen transition-all duration-300",
                isSidebarOpen ? "ml-64" : "ml-0"
            )}>
                {/* Top Header */}
                <header className="h-16 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 px-6 flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={toggleSidebar} className="-ml-2">
                        {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon">
                            <Settings className="h-5 w-5 text-gray-500" />
                        </Button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
