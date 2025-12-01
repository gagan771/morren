'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Package, DollarSign, TrendingUp, Users, Send, Eye, Calendar, ShoppingCart } from 'lucide-react';
import { Order, Bid } from '@/lib/types';
import { DashboardLayout } from '@/components/dashboard-layout';
import { BackgroundBeams } from '@/components/ui/aceternity/background-beams';
import { getOrdersWithDetails, getBidsWithDetails, createBid } from '@/lib/supabase-api';

export default function SellerDashboard() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [bids, setBids] = useState<Bid[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isBidDialogOpen, setIsBidDialogOpen] = useState(false);
    const [bidForm, setBidForm] = useState({
        bidAmount: '',
        estimatedDelivery: '',
        message: '',
    });

    // Hardcoded seller ID (will be replaced with auth later)
    const sellerId = '2';

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const [ordersData, bidsData] = await Promise.all([
                    getOrdersWithDetails(),
                    getBidsWithDetails(),
                ]);
                setOrders(ordersData);
                setBids(bidsData.filter(b => b.sellerId === sellerId));
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [sellerId]);

    // Stats
    const stats = {
        totalOrders: orders.length,
        pendingBids: bids.filter(b => b.status === 'pending').length,
        acceptedBids: bids.filter(b => b.status === 'accepted').length,
        potentialRevenue: bids.filter(b => b.status === 'accepted').reduce((sum, b) => sum + b.bidAmount, 0),
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
            bidAmount: order.totalPrice.toString(),
            estimatedDelivery: '',
            message: '',
        });
        setIsBidDialogOpen(true);
    };

    const submitBid = async () => {
        if (!selectedOrder) return;

        try {
            await createBid({
                orderId: selectedOrder.id,
                sellerId,
                bidAmount: parseFloat(bidForm.bidAmount),
                estimatedDelivery: new Date(bidForm.estimatedDelivery),
                message: bidForm.message,
                status: 'pending',
            });

            // Refresh bids
            const updatedBids = await getBidsWithDetails();
            setBids(updatedBids.filter(b => b.sellerId === sellerId));

            setIsBidDialogOpen(false);
            setBidForm({ bidAmount: '', estimatedDelivery: '', message: '' });
        } catch (error) {
            console.error('Error creating bid:', error);
            alert('Failed to create bid. Please try again.');
        }
    };

    if (loading) {
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

    return (
        <DashboardLayout role="seller">
            <div className="relative min-h-[calc(100vh-4rem)]">
                {/* Background Effect */}
                <div className="fixed inset-0 z-0 pointer-events-none opacity-50">
                    <BackgroundBeams />
                </div>

                <div className="relative z-10 space-y-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                                Seller Dashboard
                            </h1>
                            <p className="text-muted-foreground mt-1">View buyer orders and place competitive bids</p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-none shadow-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-900/80 transition-all duration-300 group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Available Orders</CardTitle>
                                <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Package className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalOrders}</div>
                                <p className="text-xs text-muted-foreground mt-1">Buyer orders to bid on</p>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-900/80 transition-all duration-300 group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Bids</CardTitle>
                                <div className="h-8 w-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.pendingBids}</div>
                                <p className="text-xs text-muted-foreground mt-1">Awaiting buyer response</p>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-900/80 transition-all duration-300 group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Accepted Bids</CardTitle>
                                <div className="h-8 w-8 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Users className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.acceptedBids}</div>
                                <p className="text-xs text-muted-foreground mt-1">Confirmed orders</p>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-900/80 transition-all duration-300 group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Potential Revenue</CardTitle>
                                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">${stats.potentialRevenue.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground mt-1">From accepted bids</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <Tabs defaultValue="orders" className="space-y-6">
                        <TabsList className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm p-1 border border-gray-200 dark:border-gray-800 rounded-xl">
                            <TabsTrigger value="orders" className="rounded-lg data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700">Buyer Orders</TabsTrigger>
                            <TabsTrigger value="mybids" className="rounded-lg data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700">My Bids</TabsTrigger>
                        </TabsList>

                        {/* Buyer Orders Tab */}
                        <TabsContent value="orders" className="space-y-6">
                            <Card className="border-none shadow-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white overflow-hidden relative">
                                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
                                <CardHeader className="relative z-10">
                                    <CardTitle className="flex items-center gap-2">
                                        <div className="p-2 bg-white/20 rounded-full">
                                            <TrendingUp className="h-5 w-5" />
                                        </div>
                                        Bidding Tips
                                    </CardTitle>
                                    <CardDescription className="text-white/90 text-base">
                                        Review buyer orders carefully and place competitive bids. Include delivery estimates and personalized messages to increase your chances.
                                    </CardDescription>
                                </CardHeader>
                            </Card>

                            <div className="grid gap-6">
                                {orders.length === 0 ? (
                                    <Card className="p-12 text-center">
                                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground">No orders available at the moment.</p>
                                    </Card>
                                ) : (
                                    orders.map((order) => (
                                        <Card key={order.id} className="border-none shadow-md hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm group">
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
                                                                Order #{order.id} • Buyer: {order.buyer?.name} • {new Date(order.createdAt).toLocaleDateString()}
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
                                                        <Label className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Buyer's Budget</Label>
                                                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">${order.totalPrice.toFixed(2)}</p>
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
                                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Buyer Notes</Label>
                                                            <p className="font-medium italic text-gray-600 dark:text-gray-400">"{order.notes}"</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {order.item?.specifications && (
                                                    <div>
                                                        <Label className="font-semibold mb-3 block text-sm uppercase tracking-wider text-gray-500">Item Specifications</Label>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                            {Object.entries(order.item.specifications).slice(0, 6).map(([key, value]) => (
                                                                <div key={key} className="bg-white dark:bg-gray-950 p-3 rounded border border-gray-100 dark:border-gray-800 shadow-sm">
                                                                    <p className="text-xs text-muted-foreground mb-1">{key}</p>
                                                                    <p className="text-sm font-medium">{value}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
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
                                    ))
                                )}
                            </div>
                        </TabsContent>

                        {/* My Bids Tab */}
                        <TabsContent value="mybids" className="space-y-6">
                            <div className="grid gap-6">
                                {bids.length === 0 ? (
                                    <Card className="p-12 text-center">
                                        <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground">You haven't placed any bids yet.</p>
                                    </Card>
                                ) : (
                                    bids.map((bid) => (
                                        <Card key={bid.id} className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                                            <CardHeader>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <CardTitle>Bid for Order #{bid.orderId}</CardTitle>
                                                        <CardDescription>
                                                            Placed on {new Date(bid.createdAt).toLocaleDateString()}
                                                        </CardDescription>
                                                    </div>
                                                    <Badge variant="outline" className={getStatusColor(bid.status)}>{bid.status}</Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
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
                                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Status</Label>
                                                        <p className="font-medium capitalize">{bid.status}</p>
                                                    </div>
                                                </div>
                                                {bid.message && (
                                                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Your Message</Label>
                                                        <p className="font-medium mt-1">"{bid.message}"</p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Place Bid Dialog */}
                    <Dialog open={isBidDialogOpen} onOpenChange={setIsBidDialogOpen}>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Place Your Bid</DialogTitle>
                                <DialogDescription>
                                    Submit a competitive bid for <span className="font-semibold text-emerald-600">{selectedOrder?.item?.name}</span>
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
                                        Buyer's budget: <span className="font-semibold">${selectedOrder?.totalPrice.toFixed(2)}</span>
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
                                    <Label htmlFor="message" className="text-sm font-medium">Message to Buyer (Optional)</Label>
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
                                >
                                    <Send className="mr-2 h-4 w-4" />
                                    Submit Bid
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </DashboardLayout>
    );
}
