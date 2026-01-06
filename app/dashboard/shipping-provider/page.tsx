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
import { Truck, DollarSign, TrendingUp, Users, Send, Calendar, Package, RefreshCw, BarChart3, PieChart, Activity, ArrowUp, ArrowDown, Minus, Trophy, AlertTriangle, ChevronDown, ChevronUp, Search, Filter, SortAsc, SortDesc, X } from 'lucide-react';
import { Order, ShippingBid } from '@/lib/types';
import { DashboardLayout } from '@/components/dashboard-layout';
import { BackgroundBeams } from '@/components/ui/aceternity/background-beams';
import { ClockTimer } from '@/components/ui/clock-timer';
import { getOrders, getShippingBidsByProvider, createShippingBid, updateShippingBid, getShippingBidsByOrder } from '@/lib/supabase-api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getDashboardRoute } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer } from 'recharts';

export default function ShippingProviderDashboard() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [bids, setBids] = useState<ShippingBid[]>([]);
    const [allOrderBids, setAllOrderBids] = useState<Record<string, ShippingBid[]>>({});
    const [showAllOrders, setShowAllOrders] = useState(false);
    const [showAllBids, setShowAllBids] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submittingBid, setSubmittingBid] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isBidDialogOpen, setIsBidDialogOpen] = useState(false);
    const [editingBid, setEditingBid] = useState<ShippingBid | null>(null);
    const [bidForm, setBidForm] = useState({
        bidAmount: '',
        estimatedDelivery: '',
        message: '',
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [inlineBidForms, setInlineBidForms] = useState<Record<string, { bidAmount: string; estimatedDelivery: string; message: string }>>({});
    
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
            router.push('/auth?role=shipping_provider');
            return;
        }
        if (user && user.role !== 'shipping_provider') {
            router.push(getDashboardRoute(user.role));
            return;
        }
    }, [user, authLoading, router]);

    const fetchData = useCallback(async (silent = false) => {
        if (!user) {
            console.log('fetchData: No user, skipping');
            return;
        }
        
        if (!silent) {
            setLoading(true);
        }
        
        try {
            console.log('Fetching orders for shipping provider:', user.id);
            const [ordersData, bidsData] = await Promise.all([
                getOrders().catch(err => {
                    console.error('Error fetching orders:', err);
                    return [];
                }),
                getShippingBidsByProvider(user.id).catch(err => {
                    console.error('Error fetching shipping bids:', err);
                    return [];
                }),
            ]);
            
            console.log('Orders fetched:', ordersData?.length || 0);
            console.log('Shipping bids fetched:', bidsData?.length || 0);
            
            setOrders(ordersData || []);
            setBids(bidsData || []);

            // Fetch all shipping bids for each order to compare
            const orderBidsMap: Record<string, ShippingBid[]> = {};
            if (ordersData && ordersData.length > 0) {
                await Promise.all(
                    ordersData.map(async (order) => {
                        try {
                            const orderBids = await getShippingBidsByOrder(order.id, false);
                            console.log(`Order ${order.id.slice(0, 8)} has ${orderBids.length} shipping bids`);
                            orderBidsMap[order.id] = orderBids || [];
                        } catch (err) {
                            console.error(`Error fetching shipping bids for order ${order.id}:`, err);
                            orderBidsMap[order.id] = [];
                        }
                    })
                );
            }
            setAllOrderBids(orderBidsMap);
            console.log('fetchData completed successfully');
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
            console.log('fetchData: setting loading to false');
            if (!silent) {
                setLoading(false);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // Initial data fetch
    useEffect(() => {
        if (user) {
            console.log('Initial fetch triggered for user:', user.id);
            fetchData(false);
        } else {
            console.log('Initial fetch skipped - no user yet');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // Safety timeout: if still loading after 5 seconds, force stop loading
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (loading && !authLoading) {
                console.warn('Loading timeout reached, forcing loading to false');
                setLoading(false);
            }
        }, 5000);

        return () => clearTimeout(timeout);
    }, [loading, authLoading]);

    // Auto-refresh orders every 10 seconds (silent updates)
    useEffect(() => {
        if (!user || submittingBid) return;

        const interval = setInterval(() => {
            fetchData(true); // Silent refresh
        }, 10000); // Poll every 10 seconds

        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, submittingBid]);

    const stats = {
        totalOrders: orders.length,
        pendingBids: bids.filter(b => b.status === 'pending').length,
        acceptedBids: bids.filter(b => b.status === 'accepted').length,
        rejectedBids: bids.filter(b => b.status === 'rejected').length,
        potentialRevenue: bids.filter(b => b.status === 'accepted').reduce((sum, b) => sum + b.bidAmount, 0),
        totalBidValue: bids.reduce((sum, b) => sum + b.bidAmount, 0),
    };

    // Get available categories
    const availableCategories = useMemo(() => {
        const categories = new Set<string>(['all']);
        orders.forEach(order => {
            if (order.item?.category) {
                categories.add(order.item.category);
            }
        });
        return Array.from(categories);
    }, [orders]);

    // Filter and sort orders
    const filteredAndSortedOrders = useMemo(() => {
        let filtered = orders.filter(order => {
            const matchesSearch = !searchQuery || 
                order.item?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.item?.specifications?.hsnCode?.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesCategory = orderCategoryFilter === 'all' || order.item?.category === orderCategoryFilter;
            
            return matchesSearch && matchesCategory;
        });

        // Sort orders
        filtered.sort((a, b) => {
            let aValue: any, bValue: any;
            
            switch (orderSortBy) {
                case 'quantity':
                    aValue = a.quantity;
                    bValue = b.quantity;
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
        
        const specs = order.item?.specifications as any;
        const specifiedDays = specs?.['Bid Running Time (days)'] || specs?.['bidRunningTime'];
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

    // Prepare monthly revenue data from shipping bids
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
                accepted: dayBids.filter(b => b.status === 'accepted').length,
                rejected: dayBids.filter(b => b.status === 'rejected').length,
                pending: dayBids.filter(b => b.status === 'pending').length,
            });
        }
        return last7Days;
    }, [bids]);

    // Helper function to get bid comparison info for an order
    const getBidComparison = (orderId: string) => {
        if (!user) return null;
        
        const orderBids = allOrderBids[orderId] || [];
        const myBid = orderBids.find(b => b.shippingProviderId === user.id);
        
        if (!myBid) return null;
        
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
        
        const otherBids = orderBids.filter(b => b.shippingProviderId !== user.id);
        const allBidAmounts = orderBids.map(b => b.bidAmount);
        const lowestBid = Math.min(...allBidAmounts);
        const highestBid = Math.max(...allBidAmounts);
        const avgBid = allBidAmounts.reduce((sum, b) => sum + b, 0) / allBidAmounts.length;
        
        const diffFromLowest = lowestBid > 0 ? ((myBid.bidAmount - lowestBid) / lowestBid) * 100 : 0;
        const diffFromHighest = highestBid > 0 ? ((myBid.bidAmount - highestBid) / highestBid) * 100 : 0;
        
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
        
        if (isOnlyBidder) {
            return (
                <div className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 border rounded-xl p-6 mb-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-blue-700 dark:text-blue-300 font-bold text-lg">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-full">
                                <Trophy className="h-6 w-6" />
                            </div>
                            <span>You're the only shipping bidder!</span>
                        </div>
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 px-3 py-1 text-sm">
                            Leading
                        </Badge>
                    </div>
                    <p className="text-blue-600 dark:text-blue-400 mt-3 ml-14">
                        Your shipping bid is currently the only offer for this order.
                    </p>
                </div>
            );
        }
        
        // Calculate position on bar based on bid amount relative to range
        const bidRange = highestBid - lowestBid;
        const positionPercent = bidRange > 0 ? ((myBid - lowestBid) / bidRange) * 100 : 0;
        
        let bgColor = 'bg-yellow-500';
        let textColor = 'text-yellow-700 dark:text-yellow-300';
        let bgLight = 'bg-yellow-50 dark:bg-yellow-900/20';
        let borderColor = 'border-yellow-200 dark:border-yellow-800';
        let icon = <Minus className="h-5 w-5" />;
        let message = '';
        let statusTitle = '';
        
        if (isLowest) {
            bgColor = 'bg-green-500';
            textColor = 'text-green-700 dark:text-green-300';
            bgLight = 'bg-green-50 dark:bg-green-900/20';
            borderColor = 'border-green-200 dark:border-green-800';
            icon = <Trophy className="h-5 w-5" />;
            statusTitle = "Best Shipping Price!";
            message = "You have the lowest shipping bid";
        } else if (diffFromLowest <= 5) {
            bgColor = 'bg-green-400';
            textColor = 'text-green-700 dark:text-green-300';
            bgLight = 'bg-green-50 dark:bg-green-900/20';
            borderColor = 'border-green-200 dark:border-green-800';
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
                
                <div className="relative mt-8 mb-2 px-2">
                    <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            Best Price (${lowestBid.toFixed(0)})
                        </span>
                        <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                            Highest (${highestBid.toFixed(0)})
                        </span>
                    </div>
                    
                    <div className="h-3 w-full rounded-full relative bg-gray-200 dark:bg-gray-700 overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-yellow-400 to-red-500 opacity-80"></div>
                    </div>
                    
                    <div 
                        className="absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-out z-10"
                        style={{ left: `calc(${Math.max(0, Math.min(100, positionPercent))}% - 1rem)` }}
                    >
                        <div className="relative mt-3">
                            <div className={`w-8 h-8 ${bgColor} rounded-full border-4 border-white dark:border-gray-900 shadow-xl flex items-center justify-center transform hover:scale-110 transition-transform`}>
                                <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                            
                            <div className={`absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 rounded-lg text-white text-xs font-bold shadow-lg flex flex-col items-center ${isLowest ? 'bg-green-600' : 'bg-gray-900'}`}>
                                <span>YOU</span>
                                <span className="text-[10px] font-normal opacity-90">${myBid.toFixed(0)}</span>
                                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent" style={{ borderTopColor: isLowest ? '#16a34a' : '#111827' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700/50 text-sm">
                    <span className="text-muted-foreground font-medium">
                        <Users className="h-4 w-4 inline mr-1.5 mb-0.5" />
                        {competitorCount} other provider{competitorCount !== 1 ? 's' : ''}
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
            bidAmount: '',
            estimatedDelivery: '',
            message: '',
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
                description: "Please fill in shipping cost and delivery date.",
                variant: "destructive",
            });
            return;
        }

        const bidAmount = parseFloat(bidData.bidAmount);
        if (isNaN(bidAmount) || bidAmount <= 0) {
            toast({
                title: "Validation Error",
                description: "Please enter a valid shipping cost.",
                variant: "destructive",
            });
            return;
        }

        // Validate delivery date is in the future
        const deliveryDate = new Date(bidData.estimatedDelivery);
        if (deliveryDate <= new Date()) {
            toast({
                title: "Validation Error",
                description: "Delivery date must be in the future.",
                variant: "destructive",
            });
            return;
        }

        setSubmittingBid(true);
        try {
            console.log('Creating shipping bid with data:', {
                orderId: order.id,
                shippingProviderId: user.id,
                bidAmount: bidAmount,
                estimatedDelivery: bidData.estimatedDelivery,
                message: bidData.message || undefined,
                status: 'pending',
            });

            await createShippingBid({
                orderId: order.id,
                shippingProviderId: user.id,
                bidAmount: bidAmount,
                estimatedDelivery: bidData.estimatedDelivery,
                message: bidData.message || undefined,
                status: 'pending',
            });

            toast({
                title: "Shipping Bid Submitted Successfully! 🎉",
                description: `Your shipping bid of $${bidAmount.toFixed(2)} has been submitted.`,
            });

            setInlineBidForms(prev => {
                const newForms = { ...prev };
                delete newForms[order.id];
                return newForms;
            });

            await fetchData(false);
        } catch (error: any) {
            console.error('Error creating shipping bid:', error);
            const errorMessage = error?.message || 
                                error?.error_description ||
                                error?.details || 
                                (typeof error === 'string' ? error : null) ||
                                "Failed to create shipping bid. Please check your connection and try again.";
            toast({
                title: "Error",
                description: errorMessage,
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
                description: "Please fill in shipping cost and delivery date.",
                variant: "destructive",
            });
            return;
        }

        const bidAmount = parseFloat(bidForm.bidAmount);
        if (isNaN(bidAmount) || bidAmount <= 0) {
            toast({
                title: "Validation Error",
                description: "Please enter a valid shipping cost.",
                variant: "destructive",
            });
            return;
        }

        // Validate delivery date is in the future
        const deliveryDate = new Date(bidForm.estimatedDelivery);
        if (deliveryDate <= new Date()) {
            toast({
                title: "Validation Error",
                description: "Delivery date must be in the future.",
                variant: "destructive",
            });
            return;
        }

        setSubmittingBid(true);
        try {
            console.log('Creating shipping bid with data:', {
                orderId: selectedOrder.id,
                shippingProviderId: user.id,
                bidAmount: bidAmount,
                estimatedDelivery: bidForm.estimatedDelivery,
                message: bidForm.message || undefined,
                status: 'pending',
            });

            await createShippingBid({
                orderId: selectedOrder.id,
                shippingProviderId: user.id,
                bidAmount: bidAmount,
                estimatedDelivery: bidForm.estimatedDelivery,
                message: bidForm.message || undefined,
                status: 'pending',
            });

            toast({
                title: "Shipping Bid Submitted Successfully! 🎉",
                description: `Your shipping bid of $${bidAmount.toFixed(2)} has been submitted.`,
            });

            setIsBidDialogOpen(false);
            setBidForm({ bidAmount: '', estimatedDelivery: '', message: '' });
            setSelectedOrder(null);

            await fetchData(false);
        } catch (error: any) {
            console.error('Error creating shipping bid:', error);
            const errorMessage = error?.message || 
                                error?.error_description ||
                                error?.details || 
                                (typeof error === 'string' ? error : null) ||
                                "Failed to create shipping bid. Please check your connection and try again.";
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setSubmittingBid(false);
        }
    };

    const updateExistingBid = async () => {
        if (!editingBid || !user) return;

        if (!bidForm.bidAmount || !bidForm.estimatedDelivery) {
            toast({
                title: "Validation Error",
                description: "Please fill in shipping cost and delivery date.",
                variant: "destructive",
            });
            return;
        }

        const bidAmount = parseFloat(bidForm.bidAmount);
        if (isNaN(bidAmount) || bidAmount <= 0) {
            toast({
                title: "Validation Error",
                description: "Please enter a valid shipping cost.",
                variant: "destructive",
            });
            return;
        }

        setSubmittingBid(true);
        try {
            await updateShippingBid(editingBid.id, {
                bidAmount: bidAmount,
                estimatedDelivery: bidForm.estimatedDelivery,
                message: bidForm.message || undefined,
            });

            toast({
                title: "Shipping Bid Updated! ✅",
                description: `Your shipping bid has been updated to $${bidAmount.toFixed(2)}.`,
            });

            setIsBidDialogOpen(false);
            setEditingBid(null);
            setBidForm({ bidAmount: '', estimatedDelivery: '', message: '' });
            setSelectedOrder(null);

            await fetchData(false);
        } catch (error: any) {
            console.error('Error updating shipping bid:', error);
            toast({
                title: "Error",
                description: error?.message || "Failed to update shipping bid. Please try again.",
                variant: "destructive",
            });
        } finally {
            setSubmittingBid(false);
        }
    };

    const openEditBidDialog = (bid: ShippingBid) => {
        const order = orders.find(o => o.id === bid.orderId);
        setEditingBid(bid);
        setSelectedOrder(order || null);
        setBidForm({
            bidAmount: bid.bidAmount.toString(),
            estimatedDelivery: bid.estimatedDelivery,
            message: bid.message || '',
        });
        setIsBidDialogOpen(true);
    };

    if (authLoading || loading) {
        return (
            <DashboardLayout role="shipping_provider">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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
        <DashboardLayout role="shipping_provider">
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
                            <p className="text-gray-600 dark:text-gray-400 mt-1">View available orders and place competitive shipping bids</p>
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
                                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalOrders}</div>
                                <p className="text-xs text-gray-500 mt-1">Orders available for shipping</p>
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
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Truck className="h-5 w-5 text-blue-600" />
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
                            
                            <div className="space-y-4">
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
                                </div>

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
                                                    <SelectItem key={category} value={category}>{category}</SelectItem>
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
                                            <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                            <p className="text-muted-foreground">No orders available at the moment.</p>
                                        </Card>
                                    ) : (
                                        <Card className="p-12 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                                            <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
                                        {(showAllOrders ? filteredAndSortedOrders : filteredAndSortedOrders.slice(0, 5)).map((order) => {
                                                            const hasMyBid = user && allOrderBids[order.id]?.some(b => b.shippingProviderId === user.id);
                                                            const bidEndTime = calculateBidEndTime(order);
                                                            const isBidExpired = new Date() > bidEndTime;
                                                            
                                                            return (
                                            <Card key={order.id} className="shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 group">
                                                <CardHeader>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                                                                <Truck className="h-6 w-6 text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <CardTitle className="flex items-center gap-2">
                                                                    {order.item?.name || 'Unknown Item'}
                                                                    <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">{order.item?.category}</Badge>
                                                                    {isBidExpired && (
                                                                        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Expired</Badge>
                                                                    )}
                                                                </CardTitle>
                                                                <CardDescription>
                                                                    Order Number: {order.id}
                                                                </CardDescription>
                                                            </div>
                                                        </div>
                                                        {!hasMyBid && !isBidExpired && (
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                placeholder="Shipping Cost ($)"
                                                                className="h-9 w-32"
                                                                value={inlineBidForms[order.id]?.bidAmount || ''}
                                                                onChange={(e) => setInlineBidForms(prev => ({
                                                                    ...prev,
                                                                    [order.id]: {
                                                                        ...prev[order.id],
                                                                        bidAmount: e.target.value,
                                                                        estimatedDelivery: prev[order.id]?.estimatedDelivery || '',
                                                                        message: prev[order.id]?.message || ''
                                                                    }
                                                                }))}
                                                            />
                                                            <Input
                                                                type="date"
                                                                className="h-9 w-36"
                                                                value={inlineBidForms[order.id]?.estimatedDelivery || ''}
                                                                min={new Date().toISOString().split('T')[0]}
                                                                onChange={(e) => setInlineBidForms(prev => ({
                                                                    ...prev,
                                                                    [order.id]: {
                                                                        ...prev[order.id],
                                                                        bidAmount: prev[order.id]?.bidAmount || '',
                                                                        estimatedDelivery: e.target.value,
                                                                        message: prev[order.id]?.message || ''
                                                                    }
                                                                }))}
                                                            />
                                                            <Button
                                                                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/20"
                                                                onClick={() => handleInlineBidSubmit(order)}
                                                                disabled={!inlineBidForms[order.id]?.bidAmount || !inlineBidForms[order.id]?.estimatedDelivery || submittingBid}
                                                            >
                                                                <Send className="mr-2 h-4 w-4" />
                                                                {submittingBid ? "Placing..." : "Place Bid"}
                                                            </Button>
                                                        </div>
                                                        )}
                                                        {hasMyBid && (
                                                            <Badge className="bg-green-100 text-green-700 border-green-200 px-4 py-2">
                                                                ✓ Bid Placed
                                                            </Badge>
                                                        )}
                                                        {isBidExpired && !hasMyBid && (
                                                            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300 px-4 py-2">
                                                                Bidding Closed
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Product</Label>
                                                            <p className="text-sm font-bold truncate" title={order.item?.name}>{order.item?.name || 'N/A'}</p>
                                                        </div>
                                                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Quantity</Label>
                                                            <p className="text-sm font-bold">{order.quantity} units</p>
                                                        </div>
                                                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Shipping Address</Label>
                                                            <p className="text-sm font-medium">{order.shippingAddress?.split(',')[0] || 'N/A'}</p>
                                                        </div>
                                                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Pincode</Label>
                                                            <p className="text-sm font-medium">{order.shippingAddress?.match(/\d{6}/)?.[0] || 'N/A'}</p>
                                                        </div>
                                                        <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-100 dark:border-orange-900/20">
                                                            <Label className="text-xs text-orange-600 dark:text-orange-400 uppercase tracking-wider">Bid Ends In</Label>
                                                            <ClockTimer 
                                                                endTime={calculateBidEndTime(order)} 
                                                                size={18}
                                                                className="mt-1"
                                                            />
                                                        </div>
                                                    </div>

                                                    {order.shippingAddress && (
                                                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Full Shipping Address</Label>
                                                            <p className="font-medium mt-1">{order.shippingAddress}</p>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                            );
                                        })}
                                        {filteredAndSortedOrders.length > 5 && (
                                            <Button
                                                variant="outline"
                                                className="w-full border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
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
                    </div>

                    {/* My Shipping Bids Section */}
                    <div className="space-y-6">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-blue-600" />
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">My Shipping Bids</h2>
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
                                
                                <div className="space-y-4">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Search className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <Input
                                            type="text"
                                            placeholder="Search bids..."
                                            className="pl-10 py-6 text-lg"
                                            value={bidSearchQuery}
                                            onChange={(e) => setBidSearchQuery(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex flex-wrap gap-4 items-center">
                                        <div className="flex items-center gap-2">
                                            <Filter className="h-4 w-4 text-muted-foreground" />
                                            <Select value={bidStatusFilter} onValueChange={(value: any) => setBidStatusFilter(value)}>
                                                <SelectTrigger className="w-[140px]">
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
                            </div>

                            <div className="grid gap-6">
                                {filteredAndSortedBids.length === 0 ? (
                                    bids.length === 0 ? (
                                        <Card className="p-12 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                                            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                            <p className="text-muted-foreground">You haven't placed any shipping bids yet.</p>
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
                                            const bidEndTime = order ? calculateBidEndTime(order) : new Date();
                                            const isBidExpired = new Date() > bidEndTime;
                                            
                                            return (
                                                <Card key={bid.id} className="shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-900/10 border-2 border-blue-100 dark:border-blue-900/50 group overflow-hidden relative">
                                                    {/* Decorative gradient overlay */}
                                                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl -z-0 group-hover:scale-150 transition-transform duration-500"></div>
                                                    
                                                    <CardHeader className="relative z-10">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-blue-500/30">
                                                                    <Truck className="h-7 w-7 text-white" />
                                                                </div>
                                                                <div>
                                                                    <CardTitle className="flex items-center gap-2 text-lg">
                                                                        {order?.item?.name || 'Unknown Item'}
                                                                        {order?.item?.category && (
                                                                            <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 hover:from-blue-200 hover:to-cyan-200 border-blue-200">{order.item.category}</Badge>
                                                                        )}
                                                                    </CardTitle>
                                                                    <CardDescription className="text-sm mt-1">
                                                                        Order #{bid.orderId.slice(0, 8)} • Placed on {new Date(bid.createdAt).toLocaleDateString()}
                                                                    </CardDescription>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-2">
                                                                <Badge variant="outline" className={`${getStatusColor(bid.status)} font-semibold text-sm px-4 py-1.5 shadow-sm`}>
                                                                    {bid.status === 'pending' ? '⏳ Pending' : bid.status === 'accepted' ? '✓ Accepted' : '✗ Rejected'}
                                                                </Badge>
                                                                {!isBidExpired && bid.status === 'pending' && (
                                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                                        Active
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="space-y-5 relative z-10">
                                                        <BidComparisonIndicator orderId={bid.orderId} />
                                                        
                                                        {bid.status === 'pending' && order && !isBidExpired && (
                                                            <div className="flex justify-end">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => openEditBidDialog(bid)}
                                                                    className="bg-gradient-to-r from-orange-50 to-amber-50 text-orange-600 border-2 border-orange-300 hover:from-orange-100 hover:to-amber-100 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-200/50 dark:from-orange-900/20 dark:to-amber-900/20 dark:text-orange-400 dark:border-orange-700 dark:hover:border-orange-600 transition-all duration-300 font-semibold"
                                                                >
                                                                    <TrendingUp className="mr-2 h-4 w-4" />
                                                                    Update Bid
                                                                </Button>
                                                            </div>
                                                        )}
                                                        
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-all duration-300 group/card">
                                                                <Label className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider font-bold flex items-center gap-1">
                                                                    <DollarSign className="h-3 w-3" />
                                                                    Your Shipping Bid
                                                                </Label>
                                                                <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2 group-hover/card:scale-105 transition-transform">${bid.bidAmount.toFixed(2)}</p>
                                                            </div>
                                                            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800 shadow-sm hover:shadow-md transition-all duration-300">
                                                                <Label className="text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wider font-bold flex items-center gap-1">
                                                                    <Calendar className="h-3 w-3" />
                                                                    Delivery Date
                                                                </Label>
                                                                <p className="font-bold text-purple-600 dark:text-purple-400 mt-2 text-sm">
                                                                    {new Date(bid.estimatedDelivery).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                </p>
                                                            </div>
                                                            <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 shadow-sm hover:shadow-md transition-all duration-300">
                                                                <Label className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-bold flex items-center gap-1">
                                                                    <Activity className="h-3 w-3" />
                                                                    Bid Status
                                                                </Label>
                                                                <p className="font-bold capitalize mt-2 text-emerald-600 dark:text-emerald-400">{bid.status}</p>
                                                            </div>
                                                            <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl border-2 border-orange-200 dark:border-orange-800 shadow-sm hover:shadow-md transition-all duration-300">
                                                                <Label className="text-xs text-orange-600 dark:text-orange-400 uppercase tracking-wider font-bold">Time Remaining</Label>
                                                                <ClockTimer 
                                                                    endTime={bidEndTime} 
                                                                    size={20}
                                                                    className="mt-2"
                                                                />
                                                            </div>
                                                        </div>

                                                        {order?.shippingAddress && (
                                                            <div className="p-4 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/30 dark:to-gray-900/30 rounded-xl border-2 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300">
                                                                <Label className="text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider font-bold flex items-center gap-1.5">
                                                                    <Package className="h-3.5 w-3.5" />
                                                                    Shipping Destination
                                                                </Label>
                                                                <p className="font-semibold mt-2 text-slate-700 dark:text-slate-300 leading-relaxed">{order.shippingAddress}</p>
                                                            </div>
                                                        )}

                                                        {bid.message && (
                                                            <div className="p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-violet-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-lg hover:shadow-blue-200/50 dark:hover:shadow-blue-900/30 transition-all duration-300">
                                                                <Label className="text-xs text-blue-700 dark:text-blue-300 uppercase tracking-wider font-bold flex items-center gap-1.5">
                                                                    <Send className="h-3.5 w-3.5" />
                                                                    Your Note to Buyer
                                                                </Label>
                                                                <p className="font-medium mt-2 text-blue-700 dark:text-blue-300 italic leading-relaxed">"{bid.message}"</p>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                        {filteredAndSortedBids.length > 5 && (
                                            <Button
                                                variant="outline"
                                                className="w-full border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
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

                    {/* Analytics Dashboard Section */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* Bid Status Distribution */}
                        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                                    <PieChart className="h-5 w-5 text-blue-600" />
                                    Bid Status Distribution
                                </CardTitle>
                                <CardDescription>Overview of your shipping bid statuses</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {bidStatusData.length > 0 ? (
                                    <ChartContainer config={{
                                        pending: { label: 'Pending', color: '#eab308' },
                                        accepted: { label: 'Accepted', color: '#22c55e' },
                                        rejected: { label: 'Rejected', color: '#ef4444' },
                                    }}>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <RechartsPieChart>
                                                <Pie
                                                    data={bidStatusData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {bidStatusData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                                    ))}
                                                </Pie>
                                                <ChartTooltip content={<ChartTooltipContent />} />
                                            </RechartsPieChart>
                                        </ResponsiveContainer>
                                    </ChartContainer>
                                ) : (
                                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                                        <div className="text-center">
                                            <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p>No bid data available</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Monthly Revenue Trend */}
                        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                                    <Activity className="h-5 w-5 text-emerald-600" />
                                    Monthly Revenue Trend
                                </CardTitle>
                                <CardDescription>Shipping revenue and total bid values over the year</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {monthlyRevenueData.some(d => d.revenue > 0 || d.bids > 0) ? (
                                    <ChartContainer config={{
                                        revenue: { label: 'Revenue', color: '#10b981' },
                                        bids: { label: 'Total Bids', color: '#3b82f6' },
                                    }}>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <AreaChart data={monthlyRevenueData}>
                                                <defs>
                                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                    </linearGradient>
                                                    <linearGradient id="colorBids" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                                <XAxis dataKey="month" className="text-xs" />
                                                <YAxis className="text-xs" />
                                                <ChartTooltip content={<ChartTooltipContent />} />
                                                <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" />
                                                <Area type="monotone" dataKey="bids" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBids)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </ChartContainer>
                                ) : (
                                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                                        <div className="text-center">
                                            <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p>No revenue data available yet</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Bid Activity (Last 7 Days) */}
                        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 lg:col-span-3">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                                    <BarChart3 className="h-5 w-5 text-blue-600" />
                                    Recent Bid Activity (Last 7 Days)
                                </CardTitle>
                                <CardDescription>Daily breakdown of your shipping bid performance</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {recentBidActivity.some(d => d.bids > 0) ? (
                                    <ChartContainer config={{
                                        accepted: { label: 'Accepted', color: '#22c55e' },
                                        pending: { label: 'Pending', color: '#eab308' },
                                        rejected: { label: 'Rejected', color: '#ef4444' },
                                    }}>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={recentBidActivity}>
                                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                                <XAxis dataKey="day" />
                                                <YAxis />
                                                <ChartTooltip content={<ChartTooltipContent />} />
                                                <Bar dataKey="accepted" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                                                <Bar dataKey="pending" stackId="a" fill="#eab308" radius={[0, 0, 0, 0]} />
                                                <Bar dataKey="rejected" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </ChartContainer>
                                ) : (
                                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                        <div className="text-center">
                                            <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p>No recent bid activity in the last 7 days</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Bid Dialog */}
                    <Dialog open={isBidDialogOpen} onOpenChange={setIsBidDialogOpen}>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>{editingBid ? 'Update Your Shipping Bid' : 'Place Your Shipping Bid'}</DialogTitle>
                                <DialogDescription>
                                    {editingBid 
                                        ? `Update your shipping bid for ${selectedOrder?.item?.name} (Order #${selectedOrder?.id.slice(0, 8)})`
                                        : `Submit a competitive shipping bid for ${selectedOrder?.item?.name} (Order #${selectedOrder?.id.slice(0, 8)})`
                                    }
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bidAmount" className="text-sm font-medium">Shipping Cost ($)</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="bidAmount"
                                            type="number"
                                            step="0.01"
                                            className="pl-9"
                                            placeholder="Enter your shipping cost"
                                            value={bidForm.bidAmount}
                                            onChange={(e) => setBidForm({ ...bidForm, bidAmount: e.target.value })}
                                        />
                                    </div>
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
                                    <Label htmlFor="message" className="text-sm font-medium">Message (Optional)</Label>
                                    <Textarea
                                        id="message"
                                        placeholder="Add a personalized message..."
                                        value={bidForm.message}
                                        onChange={(e) => setBidForm({ ...bidForm, message: e.target.value })}
                                        rows={4}
                                        className="resize-none"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => {
                                    setIsBidDialogOpen(false);
                                    setEditingBid(null);
                                    setBidForm({ bidAmount: '', estimatedDelivery: '', message: '' });
                                }}>
                                    Cancel
                                </Button>
                                <Button
                                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/20"
                                    onClick={editingBid ? updateExistingBid : submitBid}
                                    disabled={submittingBid || !bidForm.bidAmount || !bidForm.estimatedDelivery}
                                >
                                    <Send className="mr-2 h-4 w-4" />
                                    {submittingBid ? (editingBid ? "Updating..." : "Submitting...") : (editingBid ? "Update Bid" : "Submit Bid")}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
        </DashboardLayout>
    );
}

