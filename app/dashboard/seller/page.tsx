'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, DollarSign, TrendingUp, Users, Send, Calendar, ShoppingCart, RefreshCw, BarChart3, PieChart, Activity, ArrowUp, ArrowDown, Minus, Trophy, AlertTriangle, ChevronDown, ChevronUp, Search, Filter, SortAsc, SortDesc, X } from 'lucide-react';
import { Order, Bid } from '@/lib/types';
import { DashboardLayout } from '@/components/dashboard-layout';
import { BackgroundBeams } from '@/components/ui/aceternity/background-beams';
import { ClockTimer } from '@/components/ui/clock-timer';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import { getOrdersBySeller, getBidsBySeller, createBid, updateBid, getBidsByOrder } from '@/lib/supabase-api';
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
    const [editingBid, setEditingBid] = useState<Bid | null>(null);
    const [bidForm, setBidForm] = useState({
        bidAmount: '',
        estimatedDelivery: '',
        message: '',
        pickupAddress: '',
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [inlineBidForms, setInlineBidForms] = useState<Record<string, { bidAmount: string; estimatedDelivery: string; message: string; pickupAddress: string }>>({});

    // Enhanced search and filtering states
    const [bidSearchQuery, setBidSearchQuery] = useState('');
    const [orderSortBy, setOrderSortBy] = useState<'date' | 'quantity' | 'price' | 'name'>('date');
    const [orderSortDirection, setOrderSortDirection] = useState<'asc' | 'desc'>('desc');
    const [bidSortBy, setBidSortBy] = useState<'date' | 'amount' | 'status' | 'delivery'>('date');
    const [bidSortDirection, setBidSortDirection] = useState<'asc' | 'desc'>('desc');
    const [bidStatusFilter, setBidStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
    const [orderCategoryFilter, setOrderCategoryFilter] = useState<'all' | string>('all');

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

    const fetchData = useCallback(async (silent = false) => {
        if (!user) return;

        if (!silent) {
            setLoading(true);
        }

        try {
            const [ordersData, bidsData] = await Promise.all([
                getOrdersBySeller(user.id),
                getBidsBySeller(user.id),
            ]);

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
    }, [user, toast]);

    // Initial data fetch
    useEffect(() => {
        if (user) {
            fetchData(false);
        }
    }, [user, fetchData]);

    // Auto-refresh DISABLED - Only manual refresh on page reload
    // useEffect(() => {
    //     if (!user || submittingBid) return;
    //     const interval = setInterval(() => {
    //         fetchData(true);
    //     }, 60000);
    //     return () => clearInterval(interval);
    // }, [user, submittingBid, fetchData]);

    // Safety timeout: Force stop loading after 8 seconds to prevent stuck state
    useEffect(() => {
        if (!loading) return;

        const timeoutId = setTimeout(() => {
            if (loading) {
                console.warn('Loading timeout - stopping loading state');
                setLoading(false);
            }
        }, 8000); // 8 seconds timeout

        return () => clearTimeout(timeoutId);
    }, [loading]);

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

    // Get unique categories from orders
    const availableCategories = useMemo(() => {
        const categories = orders
            .map(order => order.item?.category)
            .filter(Boolean)
            .filter((category, index, arr) => arr.indexOf(category) === index);
        return ['all', ...categories];
    }, [orders]);

    // Filter and sort orders
    const filteredAndSortedOrders = useMemo(() => {
        let filtered = orders.filter(order => {
            const matchesSearch = !searchQuery ||
                order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.item?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.item?.specifications?.hsnCode?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCategory = orderCategoryFilter === 'all' ||
                order.item?.category === orderCategoryFilter;

            return matchesSearch && matchesCategory;
        });

        // Sort orders
        filtered.sort((a, b) => {
            let aValue: any, bValue: any;

            switch (orderSortBy) {
                case 'date':
                    aValue = new Date(a.createdAt);
                    bValue = new Date(b.createdAt);
                    break;
                case 'quantity':
                    aValue = a.quantity || 0;
                    bValue = b.quantity || 0;
                    break;
                case 'price':
                    aValue = a.totalPrice || 0;
                    bValue = b.totalPrice || 0;
                    break;
                case 'name':
                    aValue = (a.item?.name || '').toLowerCase();
                    bValue = (b.item?.name || '').toLowerCase();
                    break;
                default:
                    aValue = new Date(a.createdAt);
                    bValue = new Date(b.createdAt);
            }

            if (orderSortDirection === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return filtered;
    }, [orders, searchQuery, orderCategoryFilter, orderSortBy, orderSortDirection]);

    // Filter and sort bids
    const filteredAndSortedBids = useMemo(() => {
        let filtered = bids.filter(bid => {
            const order = orders.find(o => o.id === bid.orderId);
            const matchesSearch = !bidSearchQuery ||
                bid.orderId.toLowerCase().includes(bidSearchQuery.toLowerCase()) ||
                order?.item?.name?.toLowerCase().includes(bidSearchQuery.toLowerCase()) ||
                order?.item?.specifications?.hsnCode?.toLowerCase().includes(bidSearchQuery.toLowerCase()) ||
                bid.message?.toLowerCase().includes(bidSearchQuery.toLowerCase());

            const matchesStatus = bidStatusFilter === 'all' || bid.status === bidStatusFilter;

            return matchesSearch && matchesStatus;
        });

        // Sort bids
        filtered.sort((a, b) => {
            let aValue: any, bValue: any;

            switch (bidSortBy) {
                case 'date':
                    aValue = new Date(a.createdAt);
                    bValue = new Date(b.createdAt);
                    break;
                case 'amount':
                    aValue = a.bidAmount || 0;
                    bValue = b.bidAmount || 0;
                    break;
                case 'status':
                    // Custom order: pending > accepted > rejected
                    const statusOrder = { pending: 1, accepted: 2, rejected: 3 };
                    aValue = statusOrder[a.status as keyof typeof statusOrder] || 4;
                    bValue = statusOrder[b.status as keyof typeof statusOrder] || 4;
                    break;
                case 'delivery':
                    aValue = new Date(a.estimatedDelivery);
                    bValue = new Date(b.estimatedDelivery);
                    break;
                default:
                    aValue = new Date(a.createdAt);
                    bValue = new Date(b.createdAt);
            }

            if (bidSortDirection === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return filtered;
    }, [bids, orders, bidSearchQuery, bidStatusFilter, bidSortBy, bidSortDirection]);

    // Reset filters function
    const resetOrderFilters = () => {
        setSearchQuery('');
        setOrderCategoryFilter('all');
        setOrderSortBy('date');
        setOrderSortDirection('desc');
    };

    const resetBidFilters = () => {
        setBidSearchQuery('');
        setBidStatusFilter('all');
        setBidSortBy('date');
        setBidSortDirection('desc');
    };

    // Calculate bid end time based on order creation and bid running time
    const calculateBidEndTime = (order: Order) => {
        const createdAt = new Date(order.createdAt);
        const bidRunningDays = 7; // Default 7 days if not specified

        // Try to get bid running time from specifications
        const specs = order.item?.specifications as any;
        const specifiedDays = specs?.['Seller Bid Running Time (days)'] || specs?.['Bid Running Time (days)'] || specs?.['bidRunningTime'];
        const daysToAdd = specifiedDays ? parseInt(specifiedDays.toString()) : bidRunningDays;

        const endTime = new Date(createdAt.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
        return endTime;
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
                <div className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 border rounded-xl p-6 mb-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-blue-700 dark:text-blue-300 font-bold text-lg">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-full">
                                <Trophy className="h-6 w-6" />
                            </div>
                            <span>You're the only bidder!</span>
                        </div>
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 px-3 py-1 text-sm">
                            Leading
                        </Badge>
                    </div>
                    <p className="text-blue-600 dark:text-blue-400 mt-3 ml-14">
                        Your bid is currently the only offer for this order. You have a high chance of winning!
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
        let icon = <Minus className="h-5 w-5" />;
        let message = '';
        let statusTitle = '';

        if (isLowest) {
            bgColor = 'bg-emerald-500';
            textColor = 'text-emerald-700 dark:text-emerald-300';
            bgLight = 'bg-emerald-50 dark:bg-emerald-900/20';
            borderColor = 'border-emerald-200 dark:border-emerald-800';
            icon = <Trophy className="h-5 w-5" />;
            statusTitle = "Best Price!";
            message = "You have the lowest bid";
        } else if (diffFromLowest <= 5) {
            bgColor = 'bg-emerald-400';
            textColor = 'text-emerald-700 dark:text-emerald-300';
            bgLight = 'bg-emerald-50 dark:bg-emerald-900/20';
            borderColor = 'border-emerald-200 dark:border-emerald-800';
            icon = <ArrowDown className="h-5 w-5" />;
            statusTitle = "Very Competitive";
            message = `Only ${diffFromLowest.toFixed(1)}% above lowest`;
        } else if (diffFromLowest <= 15) {
            bgColor = 'bg-yellow-500';
            textColor = 'text-yellow-700 dark:text-yellow-300';
            bgLight = 'bg-yellow-50 dark:bg-yellow-900/20';
            borderColor = 'border-yellow-200 dark:border-yellow-800';
            icon = <AlertTriangle className="h-5 w-5" />;
            statusTitle = "Competitive";
            message = `${diffFromLowest.toFixed(1)}% higher than lowest`;
        } else {
            bgColor = 'bg-red-500';
            textColor = 'text-red-700 dark:text-red-300';
            bgLight = 'bg-red-50 dark:bg-red-900/20';
            borderColor = 'border-red-200 dark:border-red-800';
            icon = <ArrowUp className="h-5 w-5" />;
            statusTitle = "High Price";
            message = `${diffFromLowest.toFixed(1)}% higher than lowest`;
        }

        return (
            <div className={`${bgLight} ${borderColor} border rounded-xl p-5 mb-6 shadow-sm`}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${bgColor} bg-opacity-20`}>
                            {icon}
                        </div>
                        <div>
                            <h4 className={`font-bold text-lg ${textColor}`}>{statusTitle}</h4>
                            <p className={`text-sm ${textColor} opacity-90`}>{message}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">#{myPosition}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Rank</div>
                    </div>
                </div>

                {/* Visual Position Indicator */}
                <div className="relative mt-8 mb-2 px-2">
                    {/* Labels */}
                    <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            Best Price
                        </span>
                        <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                            Highest Price
                        </span>
                    </div>

                    {/* The Track */}
                    <div className="h-3 w-full rounded-full relative bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-yellow-400 to-red-500 opacity-80"></div>
                    </div>

                    {/* The Marker */}
                    <div
                        className="absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-out z-10"
                        style={{ left: `${Math.max(0, Math.min(100, positionPercent))}%` }}
                    >
                        <div className="relative -ml-4 mt-3"> {/* Center the marker */}
                            <div className={`w-8 h-8 ${bgColor} rounded-full border-4 border-white dark:border-gray-900 shadow-xl flex items-center justify-center transform hover:scale-110 transition-transform`}>
                                <div className="w-2 h-2 bg-white rounded-full" />
                            </div>

                            {/* Tooltip-like label */}
                            <div className={`absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-bold shadow-lg flex flex-col items-center ${isLowest ? 'bg-emerald-600' : ''}`}>
                                <span>YOU</span>
                                <span className="text-[10px] font-normal opacity-90">${myBid.toFixed(0)}</span>
                                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" style={{ borderTopColor: isLowest ? '#059669' : '#111827' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700/50 text-sm">
                    <span className="text-muted-foreground font-medium">
                        <Users className="h-4 w-4 inline mr-1.5 mb-0.5" />
                        {competitorCount} other seller{competitorCount !== 1 ? 's' : ''}
                    </span>
                    {!isLowest && (
                        <span className={`${textColor} font-medium flex items-center`}>
                            Reduce by approx. {((myBid - lowestBid) / myBid * 100).toFixed(1)}% to match best
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
            pickupAddress: '',
        });
        setIsBidDialogOpen(true);
    };

    const handleInlineBidSubmit = async (order: Order) => {
        if (!user) {
            toast({
                title: "Error",
                description: "Please log in to place a bid.",
                variant: "destructive",
            });
            return;
        }

        const bidData = inlineBidForms[order.id];
        if (!bidData?.bidAmount || !bidData?.estimatedDelivery) {
            toast({
                title: "Validation Error",
                description: "Please fill in bid amount and delivery date.",
                variant: "destructive",
            });
            return;
        }

        const bidAmount = parseFloat(bidData.bidAmount);
        if (isNaN(bidAmount) || bidAmount <= 0) {
            toast({
                title: "Validation Error",
                description: "Please enter a valid bid amount.",
                variant: "destructive",
            });
            return;
        }

        // Validate pickup address
        if (!bidData.pickupAddress || bidData.pickupAddress.trim() === '') {
            toast({
                title: "Validation Error",
                description: "Please enter your pickup address for shipping.",
                variant: "destructive",
            });
            return;
        }

        setSubmittingBid(true);
        try {
            await createBid({
                orderId: order.id,
                sellerId: user.id,
                bidAmount: bidAmount,
                estimatedDelivery: bidData.estimatedDelivery,
                message: bidData.message || undefined,
                pickupAddress: bidData.pickupAddress,
                status: 'pending',
            });

            toast({
                title: "Bid Submitted Successfully! 🎉",
                description: `Your bid of $${bidAmount.toFixed(2)} has been submitted for this order.`,
            });

            // Clear the inline form
            setInlineBidForms(prev => {
                const newForms = { ...prev };
                delete newForms[order.id];
                return newForms;
            });

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

        // Validate pickup address
        if (!bidForm.pickupAddress || bidForm.pickupAddress.trim() === '') {
            toast({
                title: "Validation Error",
                description: "Please enter your pickup address for shipping.",
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
                estimatedDelivery: bidForm.estimatedDelivery,
                message: bidForm.message || undefined,
                pickupAddress: bidForm.pickupAddress,
                status: 'pending',
            });

            toast({
                title: "Bid Submitted Successfully! 🎉",
                description: `Your bid of $${bidAmount.toFixed(2)} has been submitted for this order.`,
            });

            setIsBidDialogOpen(false);
            setBidForm({ bidAmount: '', estimatedDelivery: '', message: '', pickupAddress: '' });
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

    const updateExistingBid = async () => {
        if (!editingBid || !user) {
            toast({
                title: "Error",
                description: "No bid selected for editing.",
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
            await updateBid(editingBid.id, {
                bidAmount: bidAmount,
                estimatedDelivery: bidForm.estimatedDelivery,
                message: bidForm.message || undefined,
            });

            toast({
                title: "Bid Updated Successfully! 🎉",
                description: `Your bid has been updated to $${bidAmount.toFixed(2)}.`,
            });

            setIsBidDialogOpen(false);
            setBidForm({ bidAmount: '', estimatedDelivery: '', message: '', pickupAddress: '' });
            setEditingBid(null);

            // Refresh data immediately
            await fetchData(false);
        } catch (error: any) {
            console.error('Error updating bid:', error);
            toast({
                title: "Error",
                description: error?.message || "Failed to update bid. Please try again.",
                variant: "destructive",
            });
        } finally {
            setSubmittingBid(false);
        }
    };

    const openEditBidDialog = (bid: Bid) => {
        const order = orders.find(o => o.id === bid.orderId);
        setSelectedOrder(order || null);
        setEditingBid(bid);
        setBidForm({
            bidAmount: bid.bidAmount.toString(),
            estimatedDelivery: new Date(bid.estimatedDelivery).toISOString().split('T')[0],
            message: bid.message || '',
            pickupAddress: bid.pickupAddress || '',
        });
        setIsBidDialogOpen(true);
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
                                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">${stats.potentialRevenue.toFixed(2)}</div>
                                <p className="text-xs text-gray-500 mt-1">From accepted bids</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Place New Bid Req Section */}
                    <div className="space-y-6">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Package className="h-5 w-5 text-emerald-600" />
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Available Orders</h2>
                                    <Badge variant="secondary" className="ml-2">{filteredAndSortedOrders.length} orders</Badge>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={resetOrderFilters}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <X className="mr-1 h-4 w-4" />
                                    Clear Filters
                                </Button>
                            </div>

                            {/* Enhanced Search and Filter Controls */}
                            <div className="space-y-4">
                                {/* Search Bar */}
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <Input
                                        type="text"
                                        placeholder="Search by product name, order ID, or HSN code..."
                                        className="pl-10 py-6 text-lg"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    {searchQuery && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="absolute inset-y-0 right-0 pr-3 h-full"
                                            onClick={() => setSearchQuery('')}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                {/* Filter and Sort Controls */}
                                <div className="flex flex-wrap gap-4 items-center">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-4 w-4 text-muted-foreground" />
                                        <Select value={orderCategoryFilter} onValueChange={setOrderCategoryFilter}>
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Filter by category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Categories</SelectItem>
                                                {availableCategories.slice(1).map(category => (
                                                    <SelectItem key={category || 'unknown'} value={category || 'unknown'}>{category}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">Sort by:</span>
                                        <Select value={orderSortBy} onValueChange={(value: any) => setOrderSortBy(value)}>
                                            <SelectTrigger className="w-[140px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="date">Date Created</SelectItem>
                                                <SelectItem value="quantity">Quantity</SelectItem>
                                                <SelectItem value="price">Total Price</SelectItem>
                                                <SelectItem value="name">Product Name</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setOrderSortDirection(orderSortDirection === 'asc' ? 'desc' : 'asc')}
                                            className="p-2"
                                        >
                                            {orderSortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-6">
                            {filteredAndSortedOrders.length === 0 ? (
                                orders.length === 0 ? (
                                    <Card className="p-12 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground">No orders available at the moment.</p>
                                    </Card>
                                ) : (
                                    <Card className="p-12 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground">No orders found matching your filters.</p>
                                        <Button
                                            variant="outline"
                                            className="mt-4"
                                            onClick={resetOrderFilters}
                                        >
                                            Clear Filters
                                        </Button>
                                    </Card>
                                )
                            ) : (
                                <>
                                    {(showAllOrders ? filteredAndSortedOrders : filteredAndSortedOrders.slice(0, 5)).map((order) => (
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
                                                                Enquiry Number: {order.id}
                                                            </CardDescription>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-2 w-full">
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                placeholder="Bid Amount ($)"
                                                                className="h-11 w-48 text-base font-semibold"
                                                                value={inlineBidForms[order.id]?.bidAmount || ''}
                                                                onChange={(e) => setInlineBidForms(prev => ({
                                                                    ...prev,
                                                                    [order.id]: {
                                                                        ...prev[order.id],
                                                                        bidAmount: e.target.value,
                                                                        estimatedDelivery: prev[order.id]?.estimatedDelivery || '',
                                                                        message: prev[order.id]?.message || '',
                                                                        pickupAddress: prev[order.id]?.pickupAddress || ''
                                                                    }
                                                                }))}
                                                            />
                                                            <Input
                                                                type="date"
                                                                className="h-9 w-36"
                                                                value={inlineBidForms[order.id]?.estimatedDelivery || ''}
                                                                onChange={(e) => setInlineBidForms(prev => ({
                                                                    ...prev,
                                                                    [order.id]: {
                                                                        ...prev[order.id],
                                                                        bidAmount: prev[order.id]?.bidAmount || '',
                                                                        estimatedDelivery: e.target.value,
                                                                        message: prev[order.id]?.message || '',
                                                                        pickupAddress: prev[order.id]?.pickupAddress || ''
                                                                    }
                                                                }))}
                                                            />
                                                            <AddressAutocomplete
                                                                placeholder="Pickup Address *"
                                                                className="h-9 min-h-[36px] w-64"
                                                                value={inlineBidForms[order.id]?.pickupAddress || ''}
                                                                onChange={(value) => setInlineBidForms(prev => ({
                                                                    ...prev,
                                                                    [order.id]: {
                                                                        ...prev[order.id],
                                                                        bidAmount: prev[order.id]?.bidAmount || '',
                                                                        estimatedDelivery: prev[order.id]?.estimatedDelivery || '',
                                                                        message: prev[order.id]?.message || '',
                                                                        pickupAddress: value
                                                                    }
                                                                }))}
                                                            />
                                                            <Button
                                                                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20"
                                                                onClick={() => handleInlineBidSubmit(order)}
                                                                disabled={!inlineBidForms[order.id]?.bidAmount || !inlineBidForms[order.id]?.estimatedDelivery || !inlineBidForms[order.id]?.pickupAddress || submittingBid}
                                                            >
                                                                <Send className="mr-2 h-4 w-4" />
                                                                {submittingBid ? "Placing..." : "Place Bid"}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Product</Label>
                                                        <p className="text-sm font-bold truncate" title={order.item?.name}>{order.item?.name || 'N/A'}</p>
                                                    </div>
                                                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">HSN Code</Label>
                                                        <p className="text-sm font-medium">{order.item?.specifications?.hsnCode || 'N/A'}</p>
                                                    </div>
                                                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Quality</Label>
                                                        <p className="text-sm font-medium capitalize">{order.item?.condition || 'N/A'}</p>
                                                    </div>
                                                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Size</Label>
                                                        <p className="text-sm font-medium">{order.item?.size || 'N/A'}</p>
                                                    </div>
                                                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Quantity</Label>
                                                        <p className="text-sm font-bold">{order.quantity} units</p>
                                                    </div>
                                                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Expected Delivery</Label>
                                                        <p className="text-sm font-medium">{new Date(new Date(order.createdAt).setDate(new Date(order.createdAt).getDate() + 7)).toLocaleDateString()}</p>
                                                    </div>
                                                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Pincode</Label>
                                                        <p className="text-sm font-medium">{order.shippingAddress?.match(/\d{6}/)?.[0] || 'N/A'}</p>
                                                    </div>
                                                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Bid Running Till</Label>
                                                        <div className="flex items-center gap-2">
                                                            <ClockTimer
                                                                endTime={calculateBidEndTime(order)}
                                                                size={20}
                                                                className="mt-1"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {filteredAndSortedOrders.length > 5 && (
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
                                                    Load More ({filteredAndSortedOrders.length - 5} more)
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
                                <Badge variant="secondary" className="ml-2">{filteredAndSortedBids.length} bids</Badge>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetBidFilters}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="mr-1 h-4 w-4" />
                                Clear Filters
                            </Button>
                        </div>

                        {/* Enhanced Search and Filter Controls for Bids */}
                        <div className="space-y-4">
                            {/* Search Bar */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                                <Input
                                    type="text"
                                    placeholder="Search by product name, order ID, or message..."
                                    className="pl-10 py-6 text-lg"
                                    value={bidSearchQuery}
                                    onChange={(e) => setBidSearchQuery(e.target.value)}
                                />
                                {bidSearchQuery && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute inset-y-0 right-0 pr-3 h-full"
                                        onClick={() => setBidSearchQuery('')}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            {/* Filter and Sort Controls */}
                            <div className="flex flex-wrap gap-4 items-center">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-muted-foreground" />
                                    <Select value={bidStatusFilter} onValueChange={(value: any) => setBidStatusFilter(value)}>
                                        <SelectTrigger className="w-[160px]">
                                            <SelectValue placeholder="Filter by status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="accepted">Accepted</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Sort by:</span>
                                    <Select value={bidSortBy} onValueChange={(value: any) => setBidSortBy(value)}>
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="date">Date Created</SelectItem>
                                            <SelectItem value="amount">Bid Amount</SelectItem>
                                            <SelectItem value="status">Status</SelectItem>
                                            <SelectItem value="delivery">Delivery Date</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setBidSortDirection(bidSortDirection === 'asc' ? 'desc' : 'asc')}
                                        className="p-2"
                                    >
                                        {bidSortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-6">
                            {filteredAndSortedBids.length === 0 ? (
                                bids.length === 0 ? (
                                    <Card className="p-12 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                                        <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground">You haven't placed any bids yet.</p>
                                    </Card>
                                ) : (
                                    <Card className="p-12 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                                        <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground">No bids found matching your filters.</p>
                                        <Button
                                            variant="outline"
                                            className="mt-4"
                                            onClick={resetBidFilters}
                                        >
                                            Clear Filters
                                        </Button>
                                    </Card>
                                )
                            ) : (
                                <>
                                    {(showAllBids ? filteredAndSortedBids : filteredAndSortedBids.slice(0, 5)).map((bid) => {
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

                                                    {/* Update Bid Button - Show on all bid cards */}
                                                    <div className="flex justify-end">
                                                        <Button
                                                            onClick={() => openEditBidDialog(bid)}
                                                            disabled={bid.status !== 'pending'}
                                                            className={`${bid.status === 'pending'
                                                                ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30 border-0'
                                                                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                                                }`}
                                                        >
                                                            <TrendingUp className="mr-2 h-4 w-4" />
                                                            {bid.status === 'pending' ? 'Update Bid' : 'Bid ' + bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                                                        </Button>
                                                    </div>

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
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                                                        <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-100 dark:border-orange-900/20">
                                                            <Label className="text-xs text-orange-600 dark:text-orange-400 uppercase tracking-wider">Time Remaining</Label>
                                                            <ClockTimer
                                                                endTime={order ? calculateBidEndTime(order) : new Date()}
                                                                size={18}
                                                                className="mt-1"
                                                            />
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
                                    {filteredAndSortedBids.length > 5 && (
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
                                                    Load More ({filteredAndSortedBids.length - 5} more)
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
                                                    label={({ name, percent }) => percent !== undefined ? `${name} ${(percent * 100).toFixed(0)}%` : name}
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
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                                                </linearGradient>
                                                <linearGradient id="colorBids" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
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
                                <DialogTitle>{editingBid ? 'Update Your Bid' : 'Place Your Bid'}</DialogTitle>
                                <DialogDescription>
                                    {editingBid
                                        ? `Update your bid for ${selectedOrder?.item?.name} (Order #${selectedOrder?.id.slice(0, 8)})`
                                        : `Submit a competitive bid for ${selectedOrder?.item?.name} (Order #${selectedOrder?.id.slice(0, 8)})`
                                    }
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
                                        min={new Date().toISOString().split('T')[0]}
                                        value={bidForm.estimatedDelivery}
                                        onChange={(e) => setBidForm({ ...bidForm, estimatedDelivery: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pickupAddress" className="text-sm font-medium flex items-center gap-2">
                                        <Package className="h-4 w-4" />
                                        Pickup Address (For Shipping Provider) *
                                    </Label>
                                    <AddressAutocomplete
                                        placeholder="Enter your warehouse/facility address where goods will be collected from..."
                                        value={bidForm.pickupAddress}
                                        onChange={(value) => setBidForm({ ...bidForm, pickupAddress: value })}
                                        className="min-h-[80px]"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        This address will be shared with the shipping provider for goods collection
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="message" className="text-sm font-medium">Message (Optional)</Label>
                                    <Textarea
                                        id="message"
                                        placeholder="Add a personalized message to increase your chances..."
                                        value={bidForm.message}
                                        onChange={(e) => setBidForm({ ...bidForm, message: e.target.value })}
                                        rows={3}
                                        className="resize-none"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => {
                                    setIsBidDialogOpen(false);
                                    setEditingBid(null);
                                    setBidForm({ bidAmount: '', estimatedDelivery: '', message: '', pickupAddress: '' });
                                }}>
                                    Cancel
                                </Button>
                                <Button
                                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20"
                                    onClick={editingBid ? updateExistingBid : submitBid}
                                    disabled={submittingBid || !bidForm.bidAmount || !bidForm.estimatedDelivery || !bidForm.pickupAddress}
                                >
                                    <Send className="mr-2 h-4 w-4" />
                                    {submittingBid ? (editingBid ? "Updating..." : "Submitting...") : (editingBid ? "Update Bid" : "Submit Bid")}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </DashboardLayout>
    );
}
