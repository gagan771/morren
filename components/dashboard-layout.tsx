"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
    ShoppingCart,
    ChevronDown,
    FileText,
    BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/theme-toggle";

interface DashboardLayoutProps {
    children: React.ReactNode;
    role: "buyer" | "seller" | "admin";
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { user, signOut } = useAuth();

    const handleLogout = async () => {
        await signOut();
        router.push('/');
    };

    const navItems = {
        buyer: [
            { href: "/dashboard/buyer", label: "Browse Items", icon: ShoppingBag },
            { href: "/dashboard/buyer?tab=orders", label: "My Bid Requests", icon: Package },
            { href: "/dashboard/buyer?tab=bids", label: "Seller Bids", icon: TrendingUp },
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            {/* Navbar */}
            <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        {/* Logo and Desktop Nav */}
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <img 
                                    src="https://5.imimg.com/data5/SELLER/Logo/2023/1/CD/NH/CF/46836456/12569-comp-image-90x90.png" 
                                    alt="Logo" 
                                    className="h-14 w-14 rounded-lg mr-3 object-contain"
                                />
                                <span className="font-bold text-xl tracking-tight hidden md:block">
                                    {role === 'buyer' && 'Buyer Dashboard'}
                                    {role === 'seller' && 'Seller Dashboard'}
                                    {role === 'admin' && 'Admin Dashboard'}
                                </span>
                            </div>

                            {/* Desktop Navigation */}
                            <div className="hidden md:ml-8 md:flex md:space-x-4 items-center">
                                {currentNavItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                            pathname === item.href || (pathname === item.href.split('?')[0] && !item.href.includes('?'))
                                                ? `bg-gray-100 dark:bg-gray-800 ${getRoleColor()}`
                                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                                        )}
                                    >
                                        <item.icon className={cn("h-4 w-4 mr-2",
                                            pathname === item.href ? getRoleColor() : "text-gray-400 group-hover:text-gray-500"
                                        )} />
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Right Side: Theme Toggle, User Profile & Mobile Menu Button */}
                        <div className="flex items-center gap-2">
                            {/* Theme Toggle */}
                            <ThemeToggle />
                            
                            {/* User Dropdown */}
                            <div className="hidden md:flex items-center ml-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user?.avatar} />
                                                <AvatarFallback>{user?.name?.charAt(0)?.toUpperCase() || role[0].toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col items-start mr-2">
                                                <span className="text-sm font-medium leading-none">{user?.name || 'User'}</span>
                                                <span className="text-xs text-muted-foreground">{role}</span>
                                            </div>
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => router.push('/dashboard/rfq')}>
                                            <FileText className="mr-2 h-4 w-4" />
                                            <span>RFQs</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => router.push('/dashboard/market-prices')}>
                                            <BarChart3 className="mr-2 h-4 w-4" />
                                            <span>Market Prices</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => router.push(`/dashboard/${role}/settings`)}>
                                            <Settings className="mr-2 h-4 w-4" />
                                            <span>Settings</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={handleLogout}>
                                            <LogOut className="mr-2 h-4 w-4" />
                                            <span>Sign out</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Mobile menu button */}
                            <div className="flex items-center md:hidden">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                                >
                                    <span className="sr-only">Open main menu</span>
                                    {isMobileMenuOpen ? (
                                        <X className="block h-6 w-6" aria-hidden="true" />
                                    ) : (
                                        <Menu className="block h-6 w-6" aria-hidden="true" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 dark:border-gray-800">
                        <div className="pt-2 pb-3 space-y-1 px-2">
                            {currentNavItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center px-3 py-2 rounded-md text-base font-medium",
                                        pathname === item.href
                                            ? `bg-gray-100 dark:bg-gray-800 ${getRoleColor()}`
                                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                                    )}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <item.icon className="h-5 w-5 mr-3" />
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                        <div className="pt-4 pb-4 border-t border-gray-200 dark:border-gray-800">
                            <div className="flex items-center px-4">
                                <div className="flex-shrink-0">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={user?.avatar} />
                                        <AvatarFallback>{user?.name?.charAt(0)?.toUpperCase() || role[0].toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </div>
                                <div className="ml-3">
                                    <div className="text-base font-medium text-gray-800 dark:text-gray-200">{user?.name || 'User'}</div>
                                    <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                                </div>
                            </div>
                            <div className="mt-3 px-2 space-y-1">
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="mr-2 h-5 w-5" />
                                    Sign out
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}
