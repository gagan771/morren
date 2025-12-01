'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Store, Shield, ArrowRight, Star, Zap, Globe, Leaf, CheckCircle2, Factory, Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';
import { BackgroundBeams } from '@/components/ui/aceternity/background-beams';
import { CardBody, CardContainer, CardItem } from '@/components/ui/aceternity/3d-card';
import { Spotlight } from '@/components/ui/aceternity/spotlight';
import { Navbar } from '@/components/navbar';
import { motion } from 'framer-motion';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-neutral-950 relative flex flex-col items-center antialiased overflow-x-hidden selection:bg-purple-500 selection:text-white">
            <Navbar />

            {/* Background Effects */}
            <div className="fixed inset-0 w-full h-full pointer-events-none">
                <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />
                <BackgroundBeams className="opacity-20" />
            </div>

            {/* Hero Section */}
            <div className="container mx-auto px-6 pt-40 pb-20 relative z-10 text-center min-h-[80vh] flex flex-col justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="space-y-8"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-300 text-sm mb-4 backdrop-blur-sm">
                        <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                        Premier Exporting Firm
                    </div>

                    <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white via-neutral-200 to-neutral-500 text-center font-sans tracking-tighter leading-tight">
                        Morera <br className="hidden md:block" /> Ventures
                    </h1>

                    <p className="text-xl md:text-2xl text-neutral-400 max-w-3xl mx-auto font-light leading-relaxed">
                        Bridging the gap between quality Indian products and the global market with sustainable solutions.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                        <Link href="/auth?role=buyer">
                            <Button size="lg" className="h-12 px-8 rounded-full bg-white text-black hover:bg-neutral-200 text-base font-semibold w-full sm:w-auto">
                                Start Trading
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="#about">
                            <Button variant="outline" size="lg" className="h-12 px-8 rounded-full border-neutral-700 text-neutral-300 hover:bg-white/5 hover:text-white text-base w-full sm:w-auto">
                                Explore Products
                            </Button>
                        </Link>
                    </div>

                    <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto border-t border-white/5 mt-12">
                        <div>
                            <h3 className="text-3xl font-bold text-white">50+</h3>
                            <p className="text-neutral-500 text-sm">Countries Served</p>
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-white">100%</h3>
                            <p className="text-neutral-500 text-sm">Sustainable</p>
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-white">24/7</h3>
                            <p className="text-neutral-500 text-sm">Support</p>
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-white">MSME</h3>
                            <p className="text-neutral-500 text-sm">Registered</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* About Section */}
            <div id="about" className="container mx-auto px-6 py-24 relative z-10">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">Us</span>
                        </h2>
                        <div className="space-y-6 text-lg text-neutral-400 leading-relaxed">
                            <p>
                                Morera Ventures LLP is an exporting firm based out of Bengaluru, India. We are dedicated to bridging the gap between quality Indian products and the global market.
                            </p>
                            <p>
                                We are registered with the Indian Government as an <span className="text-white font-semibold">MSME (Ministry of Micro, Small and Medium Enterprises)</span>, ensuring compliance and reliability in all our trade operations.
                            </p>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-900/20 border border-green-800/50 text-green-400 text-sm font-medium">
                                <Leaf className="h-4 w-4" />
                                Eco-Friendly Focus
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/20 border border-blue-800/50 text-blue-400 text-sm font-medium">
                                <CheckCircle2 className="h-4 w-4" />
                                Govt. Registered
                            </div>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl opacity-20 blur-xl"></div>
                        <div className="relative bg-neutral-900/80 p-8 rounded-2xl border border-neutral-800 backdrop-blur-sm">
                            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <Factory className="h-6 w-6 text-purple-500" />
                                Our Focus Areas
                            </h3>
                            <ul className="space-y-6">
                                <li className="flex gap-4">
                                    <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                        <Leaf className="h-5 w-5 text-green-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-semibold">Sustainable Products</h4>
                                        <p className="text-neutral-400 text-sm">Exporting eco-friendly solutions like Areca plates and bamboo straws.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                                        <Star className="h-5 w-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-semibold">Agro Trading</h4>
                                        <p className="text-neutral-400 text-sm">High-quality produce including ginger, spices, and fresh fruits.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                                        <Shield className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-semibold">Medical Essentials</h4>
                                        <p className="text-neutral-400 text-sm">Supply of critical safety equipment and PPE kits.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Section */}
            <div id="products" className="container mx-auto px-6 py-24 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Our Product Range</h2>
                    <p className="text-neutral-400 max-w-2xl mx-auto text-lg">
                        Diverse portfolio of high-quality products meeting global standards.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Eco-Friendly */}
                    <div className="bg-neutral-900/40 border border-neutral-800 p-8 rounded-2xl hover:bg-neutral-900/60 hover:border-green-500/30 transition-all duration-300 group">
                        <div className="h-14 w-14 rounded-xl bg-green-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Leaf className="h-7 w-7 text-green-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4">Eco-Friendly</h3>
                        <ul className="space-y-3 text-neutral-400">
                            <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>Areca Plates</li>
                            <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>Coconut Shell Bowls</li>
                            <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>Bamboo Straws</li>
                            <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>Copper Bottles</li>
                            <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>Bio-degradable Bags</li>
                        </ul>
                    </div>

                    {/* Agro Products */}
                    <div className="bg-neutral-900/40 border border-neutral-800 p-8 rounded-2xl hover:bg-neutral-900/60 hover:border-amber-500/30 transition-all duration-300 group">
                        <div className="h-14 w-14 rounded-xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Star className="h-7 w-7 text-amber-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4">Agro Products</h3>
                        <ul className="space-y-3 text-neutral-400">
                            <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>Dry Ginger</li>
                            <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>Onion & Potato</li>
                            <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>Premium Sugar</li>
                            <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>Quality Rice</li>
                            <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>Fresh Fruits</li>
                        </ul>
                    </div>

                    {/* Medical Supplies */}
                    <div className="bg-neutral-900/40 border border-neutral-800 p-8 rounded-2xl hover:bg-neutral-900/60 hover:border-blue-500/30 transition-all duration-300 group">
                        <div className="h-14 w-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Shield className="h-7 w-7 text-blue-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4">Safety Essentials</h3>
                        <ul className="space-y-3 text-neutral-400">
                            <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>Face Masks</li>
                            <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>Face Shields</li>
                            <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>Surgical Gloves</li>
                            <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>PPE Kits</li>
                            <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>Safety Gear</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Dashboard Access Section */}
            <div className="container mx-auto px-6 py-24 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Access Portals</h2>
                    <p className="text-neutral-400 max-w-2xl mx-auto text-lg">
                        Secure dashboards for managing your trading activities.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-3 max-w-7xl mx-auto">
                    {/* Buyer Dashboard */}
                    <CardContainer className="inter-var">
                        <CardBody className="bg-gray-50 relative group/card dark:hover:shadow-2xl dark:hover:shadow-purple-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-full h-auto rounded-xl p-6 border">
                            <CardItem
                                translateZ="50"
                                className="text-xl font-bold text-neutral-600 dark:text-white"
                            >
                                Buyer Portal
                            </CardItem>
                            <CardItem
                                as="p"
                                translateZ="60"
                                className="text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-300"
                            >
                                Browse our catalog, place orders, and track shipments globally.
                            </CardItem>
                            <CardItem translateZ="100" className="w-full mt-4">
                                <div className="flex items-center justify-center w-full h-40 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl group-hover/card:shadow-xl border border-purple-500/10">
                                    <ShoppingCart className="h-16 w-16 text-purple-500" />
                                </div>
                            </CardItem>
                            <div className="flex justify-between items-center mt-8">
                                <CardItem
                                    translateZ={20}
                                    as={Link}
                                    href="/auth?role=buyer"
                                    className="px-4 py-2 rounded-xl bg-black dark:bg-white dark:text-black text-white text-xs font-bold w-full text-center"
                                >
                                    Login as Buyer
                                </CardItem>
                            </div>
                        </CardBody>
                    </CardContainer>

                    {/* Seller Dashboard */}
                    <CardContainer className="inter-var">
                        <CardBody className="bg-gray-50 relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-full h-auto rounded-xl p-6 border">
                            <CardItem
                                translateZ="50"
                                className="text-xl font-bold text-neutral-600 dark:text-white"
                            >
                                Seller Portal
                            </CardItem>
                            <CardItem
                                as="p"
                                translateZ="60"
                                className="text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-300"
                            >
                                Manage inventory, view orders, and submit competitive bids.
                            </CardItem>
                            <CardItem translateZ="100" className="w-full mt-4">
                                <div className="flex items-center justify-center w-full h-40 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl group-hover/card:shadow-xl border border-emerald-500/10">
                                    <Store className="h-16 w-16 text-emerald-500" />
                                </div>
                            </CardItem>
                            <div className="flex justify-between items-center mt-8">
                                <CardItem
                                    translateZ={20}
                                    as={Link}
                                    href="/auth?role=seller"
                                    className="px-4 py-2 rounded-xl bg-black dark:bg-white dark:text-black text-white text-xs font-bold w-full text-center"
                                >
                                    Login as Seller
                                </CardItem>
                            </div>
                        </CardBody>
                    </CardContainer>

                    {/* Admin Dashboard */}
                    <CardContainer className="inter-var">
                        <CardBody className="bg-gray-50 relative group/card dark:hover:shadow-2xl dark:hover:shadow-rose-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-full h-auto rounded-xl p-6 border">
                            <CardItem
                                translateZ="50"
                                className="text-xl font-bold text-neutral-600 dark:text-white"
                            >
                                Admin Portal
                            </CardItem>
                            <CardItem
                                as="p"
                                translateZ="60"
                                className="text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-300"
                            >
                                Internal management system for Morera Ventures operations.
                            </CardItem>
                            <CardItem translateZ="100" className="w-full mt-4">
                                <div className="flex items-center justify-center w-full h-40 bg-gradient-to-br from-rose-500/20 to-orange-500/20 rounded-xl group-hover/card:shadow-xl border border-rose-500/10">
                                    <Shield className="h-16 w-16 text-rose-500" />
                                </div>
                            </CardItem>
                            <div className="flex justify-between items-center mt-8">
                                <CardItem
                                    translateZ={20}
                                    as={Link}
                                    href="/auth?role=admin"
                                    className="px-4 py-2 rounded-xl bg-black dark:bg-white dark:text-black text-white text-xs font-bold w-full text-center"
                                >
                                    Login as Admin
                                </CardItem>
                            </div>
                        </CardBody>
                    </CardContainer>
                </div>
            </div>

            {/* Contact Section */}
            <div id="contact" className="container mx-auto px-6 py-24 relative z-10 bg-neutral-900/30 w-full">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold text-white mb-8">Get In Touch</h2>
                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        <div className="p-6 rounded-2xl bg-black/50 border border-neutral-800">
                            <div className="h-12 w-12 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                                <MapPin className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-white font-semibold mb-2">Visit Us</h3>
                            <p className="text-neutral-400">Bengaluru, India</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-black/50 border border-neutral-800">
                            <div className="h-12 w-12 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                                <Mail className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-white font-semibold mb-2">Email Us</h3>
                            <p className="text-neutral-400">contact@moreraventures.com</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-black/50 border border-neutral-800">
                            <div className="h-12 w-12 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                                <Phone className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-white font-semibold mb-2">Call Us</h3>
                            <p className="text-neutral-400">+91 123 456 7890</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="w-full py-8 border-t border-neutral-800 bg-neutral-950 relative z-10">
                <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-neutral-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} Morera Ventures LLP. All rights reserved.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
