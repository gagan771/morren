'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Package, DollarSign, TrendingUp, Users, Send, Calendar, ShoppingCart, RefreshCw, BarChart3, PieChart, Activity, ArrowUp, ArrowDown, Minus, Trophy, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Order, Bid } from '@/lib/types';
import { DashboardLayout } from '@/components/dashboard-layout';
import { BackgroundBeams } from '@/components/ui/aceternity/background-beams';
import { getOrdersBySeller, getBidsBySeller, createBid, getBidsByOrder } from '@/lib/supabase-api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function SellerDashboard() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [bids, setBids] = useState<Bid[]>([]);
    const [allOrderBids, setAllOrderBids] = useState<Record<string, Bid[]>>({});
    const [showAllOrders, setShowAllOrders] = useState(false);
    const [showAllBids, setShowAllBids] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submittingBid, setSubmittingBid] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isBidDialogOpen, setIsBidDialogOpen] = useState(false);
    const [bidForm, setBidForm] = useState({
        bidAmount: '',
        estimatedDelivery: '',
        message: '',
    });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth?role=seller');
            return;
        }
        if (user && user.role !== 'seller') {
            router.push(`/dashboard/${user.role}`);
            return;
        }
    }, [user, authLoading, router]);

    const fetchData = async (silent = false) => {
        if (!user) return;
        
        if (!silent) {
            setLoading(true);
        }
        
        try {
            console.log('Fetching orders for seller:', user.id);
            const [ordersData, bidsData] = await Promise.all([
                getOrdersBySeller(user.id),
                getBidsBySeller(user.id),
            ]);
            
            console.log('Orders fetched:', ordersData?.length || 0);
            console.log('Bids fetched:', bidsData?.length || 0);
            
            setOrders(ordersData || []);
            setBids(bidsData || []);

            // Fetch all bids for each order to compare
            const orderBidsMap: Record<string, Bid[]> = {};
            if (ordersData && ordersData.length > 0) {
                await Promise.all(
                    ordersData.map(async (order) => {
                        try {
                            // Pass false to not mask seller info for bid comparison
                            const orderBids = await getBidsByOrder(order.id, false);
                            console.log(`Order ${order.id.slice(0, 8)} has ${orderBids.length} bids`);
                            orderBidsMap[order.id] = orderBids || [];
                        } catch (err) {
                            console.error(`Error fetching bids for order ${order.id}:`, err);
                            orderBidsMap[order.id] = [];
                        }
                    })
                );
            }
            setAllOrderBids(orderBidsMap);
        } catch (error: any) {
            console.error('Error fetching data:', error);
            if (!silent) {
                toast({
                    title: "Error",
                    description: error?.message || "Failed to load orders. Please refresh the page.",
                    variant: "destructive",
                });
            }
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    };

    // Initial data fetch
    useEffect(() => {
        if (user) {
            fetchData(false);
        }
    }, [user]);

    // Auto-refresh orders every 10 seconds (silent updates)
    useEffect(() => {
        if (!user || submittingBid) return;

        const interval = setInterval(() => {
            fetchData(true); // Silent refresh
        }, 10000); // Poll every 10 seconds

        return () => clearInterval(interval);
    }, [user, submittingBid]);

    const stats = {
        totalOrders: orders.length,
        pendingBids: bids.filter(b => b.status === 'pending').length,
        acceptedBids: bids.filter(b => b.status === 'accepted').length,
        rejectedBids: bids.filter(b => b.status === 'rejected').length,
        potentialRevenue: bids.filter(b => b.status === 'accepted').reduce((sum, b) => sum + b.bidAmount, 0),
        totalBidValue: bids.reduce((sum, b) => sum + b.bidAmount, 0),
    };

    // Chart configurations
    const bidStatusChartConfig = {
        pending: { label: 'Pending', color: '#eab308' },
        accepted: { label: 'Accepted', color: '#22c55e' },
        rejected: { label: 'Rejected', color: '#ef4444' },
    };

    const revenueChartConfig = {
        revenue: { label: 'Revenue', color: '#10b981' },
        bids: { label: 'Bids', color: '#3b82f6' },
    };

    // Prepare pie chart data for bid status
    const bidStatusData = useMemo(() => {
        const pending = bids.filter(b => b.status === 'pending').length;
        const accepted = bids.filter(b => b.status === 'accepted').length;
        const rejected = bids.filter(b => b.status === 'rejected').length;
        return [
            { name: 'Pending', value: pending, fill: '#eab308' },
            { name: 'Accepted', value: accepted, fill: '#22c55e' },
            { name: 'Rejected', value: rejected, fill: '#ef4444' },
        ].filter(item => item.value > 0);
    }, [bids]);

    // Prepare monthly revenue data from bids
    const monthlyRevenueData = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentYear = new Date().getFullYear();
        
        const monthlyData = months.map((month, index) => {
            const monthBids = bids.filter(b => {
                const bidDate = new Date(b.createdAt);
                return bidDate.getMonth() === index && bidDate.getFullYear() === currentYear;
            });
            
            const acceptedRevenue = monthBids
                .filter(b => b.status === 'accepted')
                .reduce((sum, b) => sum + b.bidAmount, 0);
            
            const totalBidValue = monthBids.reduce((sum, b) => sum + b.bidAmount, 0);
            
            return {
                month,
                revenue: acceptedRevenue,
                bids: totalBidValue,
                bidCount: monthBids.length,
            };
        });
        
        return monthlyData;
    }, [bids]);

    // Prepare bid performance data (last 7 days or recent activity)
    const recentBidActivity = useMemo(() => {
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            const dayBids = bids.filter(b => {
                const bidDate = new Date(b.createdAt);
                return bidDate.toDateString() === date.toDateString();
            });
            
            last7Days.push({
                day: dateStr,
                bids: dayBids.length,
                value: dayBids.reduce((sum, b) => sum + b.bidAmount, 0),
            });
        }
        return last7Days;
    }, [bids]);

    // Calculate success rate
    const successRate = useMemo(() => {
        const totalDecided = stats.acceptedBids + stats.rejectedBids;
        if (totalDecided === 0) return 0;
        return Math.round((stats.acceptedBids / totalDecided) * 100);
    }, [stats.acceptedBids, stats.rejectedBids]);

    // Helper function to get bid comparison info for an order
    const getBidComparison = (orderId: string) => {
        if (!user) return null;
        
        const orderBids = allOrderBids[orderId] || [];
        const myBid = orderBids.find(b => b.sellerId === user.id);
        
        if (!myBid) return null;
        
        // If only one bid (mine), show that I'm the only bidder
        if (orderBids.length === 1) {
            return {
                myBid: myBid.bidAmount,
                lowestBid: myBid.bidAmount,
                highestBid: myBid.bidAmount,
                avgBid: myBid.bidAmount,
                diffFromLowest: 0,
                diffFromHighest: 0,
                myPosition: 1,
                totalBidders: 1,
                isLowest: true,
                isHighest: true,
                competitorCount: 0,
                isOnlyBidder: true,
            };
        }
        
        const otherBids = orderBids.filter(b => b.sellerId !== user.id);
        
        // Find lowest bid (best for buyer - seller wants to be lowest or close to it)
        const allBidAmounts = orderBids.map(b => b.bidAmount);
        const lowestBid = Math.min(...allBidAmounts);
        const highestBid = Math.max(...allBidAmounts);
        const avgBid = allBidAmounts.reduce((sum, b) => sum + b, 0) / allBidAmounts.length;
        
        const diffFromLowest = lowestBid > 0 ? ((myBid.bidAmount - lowestBid) / lowestBid) * 100 : 0;
        const diffFromHighest = highestBid > 0 ? ((myBid.bidAmount - highestBid) / highestBid) * 100 : 0;
        
        // Position: where does my bid stand? (1 = lowest/best, higher = worse)
        const sortedBids = [...allBidAmounts].sort((a, b) => a - b);
        const myPosition = sortedBids.indexOf(myBid.bidAmount) + 1;
        const totalBidders = orderBids.length;
        
        const isLowest = myBid.bidAmount <= lowestBid;
        const isHighest = myBid.bidAmount >= highestBid;
        
        return {
            myBid: myBid.bidAmount,
            lowestBid,
            highestBid,
            avgBid,
            diffFromLowest,
            diffFromHighest,
            myPosition,
            totalBidders,
            isLowest,
            isHighest,
            competitorCount: otherBids.length,
            isOnlyBidder: false,
        };
    };

    // Bid comparison indicator component
    const BidComparisonIndicator = ({ orderId }: { orderId: string }) => {
        const comparison = getBidComparison(orderId);
        
        if (!comparison) return null;
        
        const { myBid, lowestBid, highestBid, diffFromLowest, myPosition, totalBidders, isLowest, competitorCount, isOnlyBidder } = comparison;
        
        // If only bidder, show a special message
        if (isOnlyBidder) {
            return (
                <div className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 border rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium">
                            <Trophy className="h-4 w-4" />
                            <span>🎯 You're the only bidder so far!</span>
                        </div>
                        <Badge variant="outline" className="text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                            Leading
                        </Badge>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        Your bid is currently the only offer for this order. Stay competitive!
                    </p>
                </div>
            );
        }
        
        // Calculate position percentage (0% = best/lowest, 100% = worst/highest)
        const positionPercent = totalBidders > 1 ? ((myPosition - 1) / (totalBidders - 1)) * 100 : 0;
        
        // Determine color and message
        let bgColor = 'bg-yellow-500';
        let textColor = 'text-yellow-700 dark:text-yellow-300';
        let bgLight = 'bg-yellow-50 dark:bg-yellow-900/20';
        let borderColor = 'border-yellow-200 dark:border-yellow-800';
        let icon = <Minus className="h-4 w-4" />;
        let message = '';
        
        if (isLowest) {
            bgColor = 'bg-emerald-500';
            textColor = 'text-emerald-700 dark:text-emerald-300';
            bgLight = 'bg-emerald-50 dark:bg-emerald-900/20';
            borderColor = 'border-emerald-200 dark:border-emerald-800';
            icon = <Trophy className="h-4 w-4" />;
            message = "🏆 You have the lowest bid!";
        } else if (diffFromLowest <= 5) {
            bgColor = 'bg-emerald-400';
            textColor = 'text-emerald-700 dark:text-emerald-300';
            bgLight = 'bg-emerald-50 dark:bg-emerald-900/20';
            borderColor = 'border-emerald-200 dark:border-emerald-800';
            icon = <ArrowDown className="h-4 w-4" />;
            message = `Only ${diffFromLowest.toFixed(1)}% above the lowest bid`;
        } else if (diffFromLowest <= 15) {
            bgColor = 'bg-yellow-500';
            textColor = 'text-yellow-700 dark:text-yellow-300';
            bgLight = 'bg-yellow-50 dark:bg-yellow-900/20';
            borderColor = 'border-yellow-200 dark:border-yellow-800';
            icon = <AlertTriangle className="h-4 w-4" />;
            message = `${diffFromLowest.toFixed(1)}% higher than the lowest bid`;
        } else {
            bgColor = 'bg-red-500';
            textColor = 'text-red-700 dark:text-red-300';
            bgLight = 'bg-red-50 dark:bg-red-900/20';
            borderColor = 'border-red-200 dark:border-red-800';
            icon = <ArrowUp className="h-4 w-4" />;
            message = `${diffFromLowest.toFixed(1)}% higher than the lowest bid`;
        }
        
        return (
            <div className={`${bgLight} ${borderColor} border rounded-lg p-3 mb-4`}>
                <div className="flex items-center justify-between mb-2">
                    <div className={`flex items-center gap-2 ${textColor} font-medium`}>
                        {icon}
                        <span>{message}</span>
                    </div>
                    <Badge variant="outline" className={`${textColor} ${borderColor}`}>
                        #{myPosition} of {totalBidders} bids
                    </Badge>
                </div>
                
                {/* Horizontal position indicator */}
                <div className="relative mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Lowest bid</span>
                        <span>Highest bid</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                            className={`h-full ${bgColor} rounded-full transition-all duration-500`}
                            style={{ width: `${Math.max(5, Math.min(100, positionPercent))}%` }}
                        />
                    </div>
                    {/* My bid marker */}
                    <div 
                        className="absolute -top-1 transform -translate-x-1/2 flex flex-col items-center"
                        style={{ left: `${Math.max(5, Math.min(95, positionPercent))}%` }}
                    >
                        <div className={`w-4 h-4 ${bgColor} rounded-full border-2 border-white dark:border-gray-800 shadow-md`} />
                        <span className={`text-xs font-bold mt-1 ${textColor}`}>You</span>
                    </div>
                </div>
                
                <div className="flex items-center justify-between mt-4 text-xs">
                    <span className="text-muted-foreground">{competitorCount} other seller{competitorCount !== 1 ? 's' : ''} bidding</span>
                    {!isLowest && (
                        <span className={textColor}>
                            Lower by {diffFromLowest.toFixed(1)}% to be competitive
                        </span>
                    )}
                </div>
            </div>
        );
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
            accepted: 'bg-blue-500/10 text-blue-600 border-blue-200',
            rejected: 'bg-red-500/10 text-red-600 border-red-200',
            completed: 'bg-green-500/10 text-green-600 border-green-200',
            cancelled: 'bg-gray-500/10 text-gray-600 border-gray-200',
        };
        return colors[status] || 'bg-gray-500/10 text-gray-600 border-gray-200';
    };

    const handlePlaceBid = (order: Order) => {
        setSelectedOrder(order);
        setBidForm({
            bidAmount: (order.totalPrice || 0).toString(),
            estimatedDelivery: '',
            message: '',
        });
        setIsBidDialogOpen(true);
    };

    const submitBid = async () => {
        if (!selectedOrder || !user) {
            toast({
                title: "Error",
                description: "Please select an order to bid on.",
                variant: "destructive",
            });
            return;
        }

        if (!bidForm.bidAmount || !bidForm.estimatedDelivery) {
            toast({
                title: "Validation Error",
                description: "Please fill in bid amount and delivery date.",
                variant: "destructive",
            });
            return;
        }

        const bidAmount = parseFloat(bidForm.bidAmount);
        if (isNaN(bidAmount) || bidAmount <= 0) {
            toast({
                title: "Validation Error",
                description: "Please enter a valid bid amount.",
                variant: "destructive",
            });
            return;
        }

        setSubmittingBid(true);
        try {
            await createBid({
                orderId: selectedOrder.id,
                sellerId: user.id,
                bidAmount: bidAmount,
                estimatedDelivery: new Date(bidForm.estimatedDelivery),
                message: bidForm.message || undefined,
                status: 'pending',
            });

            toast({
                title: "Bid Submitted Successfully! 🎉",
                description: `Your bid of $${bidAmount.toFixed(2)} has been submitted for this order.`,
            });

            setIsBidDialogOpen(false);
            setBidForm({ bidAmount: '', estimatedDelivery: '', message: '' });
            setSelectedOrder(null);

            // Refresh data immediately
            await fetchData(false);
        } catch (error: any) {
            console.error('Error creating bid:', error);
            toast({
                title: "Error",
                description: error?.message || "Failed to create bid. Please try again.",
                variant: "destructive",
            });
        } finally {
            setSubmittingBid(false);
        }
    };

    if (authLoading || loading) {
        return (
            <DashboardLayout role="seller">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <DashboardLayout role="seller">
            <Toaster />
            <div className="relative min-h-[calc(100vh-4rem)]">
                <div className="fixed inset-0 z-0 pointer-events-none opacity-0 dark:opacity-50">
                    <BackgroundBeams />
                </div>

                <div className="relative z-10 space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                                Welcome back, {user.name}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">View available orders and place competitive bids</p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => fetchData(false)}
                            disabled={loading}
                            className="gap-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            {loading ? "Refreshing..." : "Refresh"}
                        </Button>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 hover:shadow-md transition-all duration-300 group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Available Orders</CardTitle>
                                <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Package className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalOrders}</div>
                                <p className="text-xs text-gray-500 mt-1">Orders available for bidding</p>
                            </CardContent>
                        </Card>

                        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 hover:shadow-md transition-all duration-300 group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Bids</CardTitle>
                                <div className="h-8 w-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.pendingBids}</div>
                                <p className="text-xs text-gray-500 mt-1">Awaiting response</p>
                            </CardContent>
                        </Card>

                        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 hover:shadow-md transition-all duration-300 group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Accepted Bids</CardTitle>
                                <div className="h-8 w-8 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Users className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.acceptedBids}</div>
                                <p className="text-xs text-gray-500 mt-1">Confirmed orders</p>
                            </CardContent>
                        </Card>

                        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 hover:shadow-md transition-all duration-300 group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Potential Revenue</CardTitle>
                                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">${stats.potentialRevenue.toFixed(2)}</div>
                                <p className="text-xs text-gray-500 mt-1">From accepted bids</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Available Orders Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-emerald-600" />
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Available Orders</h2>
                                <Badge variant="secondary" className="ml-2">{orders.length} orders</Badge>
                            </div>
                        </div>

                        <div className="grid gap-6">
                            {orders.length === 0 ? (
                                <Card className="p-12 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No orders available at the moment.</p>
                                </Card>
                            ) : (
                                <>
                                    {(showAllOrders ? orders : orders.slice(0, 5)).map((order) => (
                                        <Card key={order.id} className="shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 group">
                                            <CardHeader>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                                                            <ShoppingCart className="h-6 w-6 text-emerald-600" />
                                                        </div>
                                                        <div>
                                                            <CardTitle className="flex items-center gap-2">
                                                                {order.item?.name || 'Unknown Item'}
                                                                <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">{order.item?.category}</Badge>
                                                            </CardTitle>
                                                            <CardDescription>
                                                                Order #{order.id.slice(0, 8)} • Customer #{order.buyerId?.slice(0, 6).toUpperCase() || 'N/A'} • {new Date(order.createdAt).toLocaleDateString()}
                                                            </CardDescription>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className={getStatusColor(order.status)}>{order.status}</Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Quantity</Label>
                                                        <p className="text-lg font-bold">{order.quantity} units</p>
                                                    </div>
                                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-900/20">
                                                        <Label className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Order Budget</Label>
                                                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">${(order.totalPrice || 0).toFixed(2)}</p>
                                                    </div>
                                                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Size</Label>
                                                        <p className="text-lg font-medium">{order.item?.size || 'N/A'}</p>
                                                    </div>
                                                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Condition</Label>
                                                        <p className="text-lg font-medium capitalize">{order.item?.condition || 'N/A'}</p>
                                                    </div>
                                                </div>

                                                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg space-y-2 border border-gray-100 dark:border-gray-800">
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-1">
                                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Shipping Address</Label>
                                                            <p className="font-medium">{order.shippingAddress}</p>
                                                        </div>
                                                    </div>
                                                    {order.notes && (
                                                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Customer Notes</Label>
                                                            <p className="font-medium italic text-gray-600 dark:text-gray-400">"{order.notes}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                            <CardFooter className="gap-3 bg-gray-50/50 dark:bg-gray-900/50 p-4">
                                                <Button
                                                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20"
                                                    onClick={() => handlePlaceBid(order)}
                                                >
                                                    <Send className="mr-2 h-4 w-4" />
                                                    Place Bid
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                    {orders.length > 5 && (
                                        <Button
                                            variant="outline"
                                            className="w-full border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                            onClick={() => setShowAllOrders(!showAllOrders)}
                                        >
                                            {showAllOrders ? (
                                                <>
                                                    <ChevronUp className="mr-2 h-4 w-4" />
                                                    Show Less
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="mr-2 h-4 w-4" />
                                                    Load More ({orders.length - 5} more)
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* My Bids Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-emerald-600" />
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">My Bids</h2>
                                <Badge variant="secondary" className="ml-2">{bids.length} bids</Badge>
                            </div>
                        </div>

                        <div className="grid gap-6">
                            {bids.length === 0 ? (
                                <Card className="p-12 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">You haven't placed any bids yet.</p>
                                </Card>
                            ) : (
                                <>
                                    {(showAllBids ? bids : bids.slice(0, 5)).map((bid) => {
                                        const order = orders.find(o => o.id === bid.orderId);
                                        return (
                                            <Card key={bid.id} className="shadow-md hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                                                <CardHeader>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                                                <ShoppingCart className="h-6 w-6 text-emerald-600" />
                                                            </div>
                                                            <div>
                                                                <CardTitle className="flex items-center gap-2">
                                                                    {order?.item?.name || 'Unknown Item'}
                                                                    {order?.item?.category && (
                                                                        <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">{order.item.category}</Badge>
                                                                    )}
                                                                </CardTitle>
                                                                <CardDescription>
                                                                    Order #{bid.orderId.slice(0, 8)} • Placed on {new Date(bid.createdAt).toLocaleDateString()}
                                                                </CardDescription>
                                                            </div>
                                                        </div>
                                                        <Badge variant="outline" className={getStatusColor(bid.status)}>{bid.status}</Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <BidComparisonIndicator orderId={bid.orderId} />
                                                    
                                                    {/* Product Info */}
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Quantity</Label>
                                                            <p className="text-lg font-bold">{order?.quantity || 'N/A'} units</p>
                                                        </div>
                                                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Size</Label>
                                                            <p className="text-lg font-medium">{order?.item?.size || 'N/A'}</p>
                                                        </div>
                                                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Quality/Condition</Label>
                                                            <p className="text-lg font-medium capitalize">{order?.item?.condition || 'N/A'}</p>
                                                        </div>
                                                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Order Budget</Label>
                                                            <p className="text-lg font-medium text-gray-600">${(order?.totalPrice || 0).toFixed(2)}</p>
                                                        </div>
                                                    </div>

                                                    {/* Bid Info */}
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-900/20">
                                                            <Label className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Your Bid Amount</Label>
                                                            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">${bid.bidAmount.toFixed(2)}</p>
                                                        </div>
                                                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Estimated Delivery</Label>
                                                            <p className="font-medium flex items-center gap-1">
                                                                <Calendar className="h-4 w-4" />
                                                                {new Date(bid.estimatedDelivery).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Bid Status</Label>
                                                            <p className="font-medium capitalize">{bid.status}</p>
                                                        </div>
                                                    </div>

                                                    {/* Shipping Address */}
                                                    {order?.shippingAddress && (
                                                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Shipping Address</Label>
                                                            <p className="font-medium mt-1">{order.shippingAddress}</p>
                                                        </div>
                                                    )}

                                                    {/* Customer Notes */}
                                                    {order?.notes && (
                                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/20">
                                                            <Label className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider">Customer Notes</Label>
                                                            <p className="font-medium mt-1 italic">"{order.notes}"</p>
                                                        </div>
                                                    )}

                                                    {/* Your Message */}
                                                    {bid.message && (
                                                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-900/20">
                                                            <Label className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Your Message</Label>
                                                            <p className="font-medium mt-1">"{bid.message}"</p>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                    {bids.length > 5 && (
                                        <Button
                                            variant="outline"
                                            className="w-full border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                            onClick={() => setShowAllBids(!showAllBids)}
                                        >
                                            {showAllBids ? (
                                                <>
                                                    <ChevronUp className="mr-2 h-4 w-4" />
                                                    Show Less
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="mr-2 h-4 w-4" />
                                                    Load More ({bids.length - 5} more)
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Analytics Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-emerald-600" />
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Analytics Overview</h2>
                        </div>
                        
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {/* Bid Status Pie Chart */}
                            <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-gray-100">
                                        <PieChart className="h-5 w-5 text-emerald-600" />
                                        Bid Status Distribution
                                    </CardTitle>
                                    <CardDescription>Overview of your bid outcomes</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {bidStatusData.length > 0 ? (
                                        <ChartContainer config={bidStatusChartConfig} className="h-[220px] w-full">
                                            <RechartsPieChart>
                                                <Pie
                                                    data={bidStatusData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={80}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                    labelLine={false}
                                                >
                                                    {bidStatusData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                                    ))}
                                                </Pie>
                                                <ChartTooltip content={<ChartTooltipContent />} />
                                            </RechartsPieChart>
                                        </ChartContainer>
                                    ) : (
                                        <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                                            <div className="text-center">
                                                <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                                <p>No bid data available</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex justify-center gap-4 mt-4">
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full bg-yellow-500" />
                                            <span className="text-xs text-muted-foreground">Pending ({stats.pendingBids})</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full bg-green-500" />
                                            <span className="text-xs text-gray-500 dark:text-gray-400">Accepted ({stats.acceptedBids})</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full bg-red-500" />
                                            <span className="text-xs text-gray-500 dark:text-gray-400">Rejected ({stats.rejectedBids})</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Success Rate Card */}
                            <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-gray-100">
                                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                                        Performance Metrics
                                    </CardTitle>
                                    <CardDescription>Your overall success rate</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex flex-col items-center">
                                        <div className="relative h-32 w-32">
                                            <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-200 dark:text-gray-700" />
                                                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" strokeDasharray={`${successRate * 2.51} 251`} className="text-emerald-500" strokeLinecap="round" />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{successRate}%</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-2">Bid Success Rate</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                            <p className="text-2xl font-bold text-emerald-600">{bids.length}</p>
                                            <p className="text-xs text-muted-foreground">Total Bids</p>
                                        </div>
                                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <p className="text-2xl font-bold text-blue-600">${stats.totalBidValue.toFixed(0)}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Value</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Revenue Summary */}
                            <Card className="border border-emerald-200 dark:border-emerald-800 shadow-sm bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg text-white">
                                        <DollarSign className="h-5 w-5" />
                                        Revenue Summary
                                    </CardTitle>
                                    <CardDescription className="text-emerald-100">Your earnings overview</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center p-3 bg-white/20 rounded-lg">
                                            <span className="text-emerald-100">Total Potential</span>
                                            <span className="text-xl font-bold">${stats.totalBidValue.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-white/20 rounded-lg">
                                            <span className="text-emerald-100">Confirmed Revenue</span>
                                            <span className="text-xl font-bold">${stats.potentialRevenue.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-white/20 rounded-lg">
                                            <span className="text-emerald-100">Avg. Bid Value</span>
                                            <span className="text-xl font-bold">
                                                ${bids.length > 0 ? (stats.totalBidValue / bids.length).toFixed(2) : '0.00'}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Full Width Charts */}
                        <div className="grid gap-6 lg:grid-cols-2">
                            <Card className="shadow-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Activity className="h-5 w-5 text-emerald-600" />
                                        Monthly Revenue Trends
                                    </CardTitle>
                                    <CardDescription>Your earnings from accepted bids over time</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer config={revenueChartConfig} className="h-[250px] w-full">
                                        <AreaChart data={monthlyRevenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                                                </linearGradient>
                                                <linearGradient id="colorBids" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                            <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                                            <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" tickFormatter={(value) => `$${value}`} />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" name="Accepted Revenue" />
                                            <Area type="monotone" dataKey="bids" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBids)" name="Total Bid Value" />
                                        </AreaChart>
                                    </ChartContainer>
                                    <div className="flex justify-center gap-6 mt-4">
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full bg-emerald-500" />
                                            <span className="text-xs text-muted-foreground">Accepted Revenue</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full bg-blue-500" />
                                            <span className="text-xs text-muted-foreground">Total Bid Value</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <BarChart3 className="h-5 w-5 text-emerald-600" />
                                        Last 7 Days Activity
                                    </CardTitle>
                                    <CardDescription>Your recent bidding activity</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer config={{ bids: { label: 'Bids', color: '#10b981' } }} className="h-[250px] w-full">
                                        <BarChart data={recentBidActivity} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                            <XAxis dataKey="day" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                                            <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                                            <ChartTooltip 
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        return (
                                                            <div className="bg-background border rounded-lg p-2 shadow-lg">
                                                                <p className="text-sm font-medium">{payload[0].payload.day}</p>
                                                                <p className="text-xs text-muted-foreground">Bids: {payload[0].payload.bids}</p>
                                                                <p className="text-xs text-emerald-600">Value: ${payload[0].payload.value.toFixed(2)}</p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Bar dataKey="bids" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <Dialog open={isBidDialogOpen} onOpenChange={setIsBidDialogOpen}>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Place Your Bid</DialogTitle>
                                <DialogDescription>
                                    Submit a competitive bid for <span className="font-semibold text-emerald-600">{selectedOrder?.item?.name}</span> (Order #{selectedOrder?.id.slice(0, 8)})
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bidAmount" className="text-sm font-medium">Bid Amount ($)</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="bidAmount"
                                            type="number"
                                            step="0.01"
                                            className="pl-9"
                                            placeholder="Enter your bid amount"
                                            value={bidForm.bidAmount}
                                            onChange={(e) => setBidForm({ ...bidForm, bidAmount: e.target.value })}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Order budget: <span className="font-semibold">${(selectedOrder?.totalPrice || 0).toFixed(2)}</span>
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="estimatedDelivery" className="text-sm font-medium">Estimated Delivery Date</Label>
                                    <Input
                                        id="estimatedDelivery"
                                        type="date"
                                        value={bidForm.estimatedDelivery}
                                        onChange={(e) => setBidForm({ ...bidForm, estimatedDelivery: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="message" className="text-sm font-medium">Message (Optional)</Label>
                                    <Textarea
                                        id="message"
                                        placeholder="Add a personalized message to increase your chances..."
                                        value={bidForm.message}
                                        onChange={(e) => setBidForm({ ...bidForm, message: e.target.value })}
                                        rows={4}
                                        className="resize-none"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsBidDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20"
                                    onClick={submitBid}
                                    disabled={submittingBid || !bidForm.bidAmount || !bidForm.estimatedDelivery}
                                >
                                    <Send className="mr-2 h-4 w-4" />
                                    {submittingBid ? "Submitting..." : "Submit Bid"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </DashboardLayout>
    );
}
