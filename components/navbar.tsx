"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X, ShoppingBag } from "lucide-react";

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { href: "/", label: "Home" },
        { href: "#about", label: "About" },
        { href: "#products", label: "Products" },
        { href: "#contact", label: "Contact" },
    ];

    return (
        <nav
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
                isScrolled
                    ? "bg-black/50 backdrop-blur-md border-white/10 py-3"
                    : "bg-transparent py-5"
            )}
        >
            <div className="container mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ShoppingBag className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-bold text-xl text-white tracking-tight">
                        Morera Ventures
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            className="text-sm font-medium text-neutral-300 hover:text-white transition-colors relative group"
                        >
                            {link.label}
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all group-hover:w-full" />
                        </Link>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="hidden md:flex items-center gap-4">
                    <Link href="/auth">
                        <Button variant="ghost" className="text-white hover:bg-white/10">
                            Sign In
                        </Button>
                    </Link>
                    <Link href="/auth?role=buyer">
                        <Button className="bg-white text-black hover:bg-neutral-200 rounded-full px-6">
                            Get Started
                        </Button>
                    </Link>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden text-white"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-lg border-b border-white/10 p-6 space-y-4 animate-in slide-in-from-top-5">
                    {navLinks.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            className="block text-lg font-medium text-neutral-300 hover:text-white"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <div className="pt-4 flex flex-col gap-3">
                        <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                            <Button variant="outline" className="w-full border-neutral-700 text-neutral-300">
                                Sign In
                            </Button>
                        </Link>
                        <Link href="/auth?role=buyer" onClick={() => setIsMobileMenuOpen(false)}>
                            <Button className="w-full bg-white text-black">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}
