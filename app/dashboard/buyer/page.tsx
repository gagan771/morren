'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Package, DollarSign, TrendingUp, Eye, Plus, Check, X, Clock } from 'lucide-react';
import { mockItems, mockOrders, mockBids, getItemsWithSeller, getOrdersWithDetails, getBidsWithDetails } from '@/lib/mock-data';
import { Item, Order, Bid } from '@/lib/types';
import { DashboardLayout } from '@/components/dashboard-layout';
import { CardBody, CardContainer, CardItem } from '@/components/ui/aceternity/3d-card';
import { BackgroundBeams } from '@/components/ui/aceternity/background-beams';

export default function BuyerDashboard() {
    const [items] = useState<Item[]>(getItemsWithSeller());
    const [orders] = useState<Order[]>(getOrdersWithDetails());
    const [bids] = useState<Bid[]>(getBidsWithDetails());
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);

    // Stats
    const stats = {
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        totalSpent: orders.reduce((sum, o) => sum + o.totalPrice, 0),
        activeBids: bids.filter(b => b.status === 'pending').length,
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

    return (
        <DashboardLayout role="buyer">
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
                                Welcome back, Buyer
                            </h1>
                            <p className="text-muted-foreground mt-1">Here's what's happening with your orders today.</p>
                        </div>
                        <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/20 transition-all hover:scale-105">
                            <Plus className="mr-2 h-4 w-4" />
                            Create New Order
                        </Button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-none shadow-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-900/80 transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
                                <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                    <ShoppingCart className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalOrders}</div>
                                <p className="text-xs text-muted-foreground mt-1">All time orders placed</p>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-900/80 transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Orders</CardTitle>
                                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.pendingOrders}</div>
                                <p className="text-xs text-muted-foreground mt-1">Awaiting confirmation</p>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-900/80 transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
                                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">${stats.totalSpent.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground mt-1">Lifetime spending</p>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-900/80 transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Active Bids</CardTitle>
                                <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                    <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.activeBids}</div>
                                <p className="text-xs text-muted-foreground mt-1">Pending seller bids</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <Tabs defaultValue="items" className="space-y-6">
                        <TabsList className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm p-1 border border-gray-200 dark:border-gray-800 rounded-xl">
                            <TabsTrigger value="items" className="rounded-lg data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">Browse Items</TabsTrigger>
                            <TabsTrigger value="orders" className="rounded-lg data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">My Orders</TabsTrigger>
                            <TabsTrigger value="bids" className="rounded-lg data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">Seller Bids</TabsTrigger>
                        </TabsList>

                        {/* Browse Items Tab with 3D Cards */}
                        <TabsContent value="items" className="space-y-6">
                            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                                {items.map((item) => (
                                    <CardContainer key={item.id} className="inter-var w-full">
                                        <CardBody className="bg-white dark:bg-gray-950 relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:border-white/[0.2] border-black/[0.1] w-full h-auto rounded-xl p-6 border shadow-xl">
                                            <CardItem
                                                translateZ="50"
                                                className="text-xl font-bold text-neutral-600 dark:text-white"
                                            >
                                                {item.name}
                                            </CardItem>
                                            <CardItem
                                                as="p"
                                                translateZ="60"
                                                className="text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-300 line-clamp-2"
                                            >
                                                {item.description}
                                            </CardItem>
                                            <CardItem translateZ="100" className="w-full mt-4">
                                                <div className="flex items-center justify-center w-full h-40 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl group-hover/card:shadow-xl">
                                                    <Package className="h-16 w-16 text-purple-500/50" />
                                                </div>
                                            </CardItem>
                                            <div className="flex justify-between items-center mt-8">
                                                <CardItem
                                                    translateZ={20}
                                                    className="px-4 py-2 rounded-xl text-xs font-normal dark:text-white"
                                                >
                                                    <span className="text-2xl font-bold text-purple-600">${item.price}</span>
                                                    <span className="text-muted-foreground ml-1">/ {item.size}</span>
                                                </CardItem>
                                                <CardItem
                                                    translateZ={20}
                                                    as="button"
                                                    className="px-4 py-2 rounded-xl bg-black dark:bg-white dark:text-black text-white text-xs font-bold"
                                                >
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <span className="flex items-center cursor-pointer" onClick={() => setSelectedItem(item)}>
                                                                View Details
                                                            </span>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                                            <DialogHeader>
                                                                <DialogTitle>{item.name}</DialogTitle>
                                                                <DialogDescription>{item.description}</DialogDescription>
                                                            </DialogHeader>
                                                            <div className="space-y-4">
                                                                <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg">
                                                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                                                        <Package className="h-32 w-32" />
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <Label className="text-muted-foreground">Price</Label>
                                                                        <p className="text-2xl font-bold text-purple-600">${item.price}</p>
                                                                    </div>
                                                                    <div>
                                                                        <Label className="text-muted-foreground">Size</Label>
                                                                        <p className="text-lg font-medium">{item.size}</p>
                                                                    </div>
                                                                    <div>
                                                                        <Label className="text-muted-foreground">Category</Label>
                                                                        <p className="text-lg font-medium">{item.category}</p>
                                                                    </div>
                                                                    <div>
                                                                        <Label className="text-muted-foreground">Condition</Label>
                                                                        <p className="text-lg font-medium capitalize">{item.condition}</p>
                                                                    </div>
                                                                    <div>
                                                                        <Label className="text-muted-foreground">Available Stock</Label>
                                                                        <p className="text-lg font-medium">{item.quantity} units</p>
                                                                    </div>
                                                                    <div>
                                                                        <Label className="text-muted-foreground">Seller</Label>
                                                                        <p className="text-lg font-medium">{item.seller?.name || 'Unknown'}</p>
                                                                    </div>
                                                                </div>

                                                                <Separator />

                                                                <div>
                                                                    <Label className="text-lg font-semibold mb-2 block">Specifications</Label>
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        {Object.entries(item.specifications).map(([key, value]) => (
                                                                            <div key={key} className="bg-muted p-3 rounded-lg">
                                                                                <p className="text-sm text-muted-foreground">{key}</p>
                                                                                <p className="font-medium">{value}</p>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <DialogFooter>
                                                                <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                                                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                                                    Place Order
                                                                </Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                </CardItem>
                                            </div>
                                        </CardBody>
                                    </CardContainer>
                                ))}
                            </div>
                        </TabsContent>

                        {/* My Orders Tab */}
                        <TabsContent value="orders" className="space-y-4">
                            <div className="grid gap-4">
                                {orders.map((order) => (
                                    <Card key={order.id} className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                                        <Package className="h-6 w-6 text-purple-600" />
                                                    </div>
                                                    <div>
                                                        <CardTitle>{order.item?.name || 'Unknown Item'}</CardTitle>
                                                        <CardDescription>Order #{order.id} • {new Date(order.createdAt).toLocaleDateString()}</CardDescription>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className={getStatusColor(order.status)}>{order.status}</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Quantity</Label>
                                                    <p className="font-semibold">{order.quantity} units</p>
                                                </div>
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Total Price</Label>
                                                    <p className="font-semibold text-purple-600">${order.totalPrice.toFixed(2)}</p>
                                                </div>
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Status</Label>
                                                    <p className="font-semibold capitalize">{order.status}</p>
                                                </div>
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Updated</Label>
                                                    <p className="font-semibold">{new Date(order.updatedAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Seller Bids Tab */}
                        <TabsContent value="bids" className="space-y-4">
                            <div className="grid gap-4">
                                {bids.map((bid) => (
                                    <Card key={bid.id} className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-blue-500" />
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle>Bid from {bid.seller?.name || 'Unknown Seller'}</CardTitle>
                                                    <CardDescription>
                                                        Order #{bid.orderId} • {new Date(bid.createdAt).toLocaleDateString()}
                                                    </CardDescription>
                                                </div>
                                                <Badge variant="outline" className={getStatusColor(bid.status)}>{bid.status}</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Bid Amount</Label>
                                                    <p className="text-xl font-bold text-purple-600">${bid.bidAmount.toFixed(2)}</p>
                                                </div>
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Estimated Delivery</Label>
                                                    <p className="font-medium">{new Date(bid.estimatedDelivery).toLocaleDateString()}</p>
                                                </div>
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Status</Label>
                                                    <p className="font-medium capitalize">{bid.status}</p>
                                                </div>
                                            </div>
                                            {bid.message && (
                                                <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-900/20">
                                                    <Label className="text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wider font-semibold">Message from Seller</Label>
                                                    <p className="font-medium mt-1 text-gray-700 dark:text-gray-300">"{bid.message}"</p>
                                                </div>
                                            )}
                                        </CardContent>
                                        {bid.status === 'pending' && (
                                            <CardFooter className="gap-3 bg-gray-50/50 dark:bg-gray-900/50 p-4">
                                                <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20">
                                                    <Check className="mr-2 h-4 w-4" />
                                                    Accept Bid
                                                </Button>
                                                <Button variant="destructive" className="flex-1 shadow-lg shadow-red-500/20">
                                                    <X className="mr-2 h-4 w-4" />
                                                    Reject Bid
                                                </Button>
                                            </CardFooter>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </DashboardLayout>
    );
}
