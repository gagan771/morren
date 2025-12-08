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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Package, ShoppingCart, TrendingUp, Users, Plus, Edit, Trash2, Eye, BarChart3, Shield, UserPlus } from 'lucide-react';
import { Item, Order, Bid, User } from '@/lib/types';
import { DashboardLayout } from '@/components/dashboard-layout';
import { BackgroundBeams } from '@/components/ui/aceternity/background-beams';
import { useAuth } from '@/contexts/AuthContext';
import { getItems, getOrders, getBids, getUsers, createItem, updateItem, deleteItem, deleteOrder, getAdminStats, createSellerAccount } from '@/lib/supabase-api';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [items, setItems] = useState<Item[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [bids, setBids] = useState<Bid[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
    const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
    const [isAddSellerDialogOpen, setIsAddSellerDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);

    const [itemForm, setItemForm] = useState({
        name: '',
        description: '',
        price: '',
        size: '',
        category: '',
        condition: 'new' as 'new' | 'used' | 'refurbished',
        quantity: '',
        specifications: {} as Record<string, string>,
    });

    const [sellerForm, setSellerForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [isCreatingSeller, setIsCreatingSeller] = useState(false);

    const [specKey, setSpecKey] = useState('');
    const [specValue, setSpecValue] = useState('');

    // Stats
    const stats = {
        totalItems: items.length,
        totalOrders: orders.length,
        totalBids: bids.length,
        totalUsers: users.length,
        activeItems: items.filter(i => i.status === 'active').length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        totalRevenue: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.totalPrice, 0),
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
            accepted: 'bg-blue-500/10 text-blue-600 border-blue-200',
            rejected: 'bg-red-500/10 text-red-600 border-red-200',
            completed: 'bg-green-500/10 text-green-600 border-green-200',
            cancelled: 'bg-gray-500/10 text-gray-600 border-gray-200',
            active: 'bg-green-500/10 text-green-600 border-green-200',
            sold: 'bg-blue-500/10 text-blue-600 border-blue-200',
            inactive: 'bg-gray-500/10 text-gray-600 border-gray-200',
        };
        return colors[status] || 'bg-gray-500/10 text-gray-600 border-gray-200';
    };

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth?role=admin');
            return;
        }
        if (user && user.role !== 'admin') {
            router.push(`/dashboard/${user.role}`);
            return;
        }
        if (user) {
            fetchData();
        }
    }, [user, authLoading, router]);

    const fetchData = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const [itemsData, ordersData, bidsData, usersData] = await Promise.all([
                getItems(),
                getOrders(),
                getBids(),
                getUsers(),
            ]);
            setItems(itemsData);
            setOrders(ordersData);
            setBids(bidsData);
            setUsers(usersData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async () => {
        if (!user) return;
        try {
            await createItem({
                name: itemForm.name,
                description: itemForm.description,
                image: '/api/placeholder/400/300',
                price: parseFloat(itemForm.price),
                size: itemForm.size,
                category: itemForm.category,
                condition: itemForm.condition,
                quantity: parseInt(itemForm.quantity),
                specifications: itemForm.specifications,
                sellerId: user.id, // Admin can create items
                status: 'active',
            });
            setIsAddItemDialogOpen(false);
            resetItemForm();
            await fetchData();
        } catch (error) {
            console.error('Error creating item:', error);
            alert('Failed to create item. Please try again.');
        }
    };

    const handleEditItem = async () => {
        if (!selectedItem) return;
        try {
            await updateItem(selectedItem.id, {
                name: itemForm.name,
                description: itemForm.description,
                price: parseFloat(itemForm.price),
                size: itemForm.size,
                category: itemForm.category,
                condition: itemForm.condition,
                quantity: parseInt(itemForm.quantity),
                specifications: itemForm.specifications,
            });
            setIsEditItemDialogOpen(false);
            resetItemForm();
            await fetchData();
        } catch (error) {
            console.error('Error updating item:', error);
            alert('Failed to update item. Please try again.');
        }
    };

    const handleDeleteItem = async (id: string) => {
        try {
            await deleteItem(id);
            await fetchData();
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Failed to delete item. Please try again.');
        }
    };

    const handleDeleteOrder = async (id: string) => {
        try {
            await deleteOrder(id);
            await fetchData();
        } catch (error) {
            console.error('Error deleting order:', error);
            alert('Failed to delete order. Please try again.');
        }
    };

    const resetItemForm = () => {
        setItemForm({
            name: '',
            description: '',
            price: '',
            size: '',
            category: '',
            condition: 'new',
            quantity: '',
            specifications: {},
        });
        setSelectedItem(null);
    };

    const openEditDialog = (item: Item) => {
        setSelectedItem(item);
        setItemForm({
            name: item.name,
            description: item.description,
            price: item.price.toString(),
            size: item.size,
            category: item.category,
            condition: item.condition,
            quantity: item.quantity.toString(),
            specifications: item.specifications,
        });
        setIsEditItemDialogOpen(true);
    };

    const addSpecification = () => {
        if (specKey && specValue) {
            setItemForm({
                ...itemForm,
                specifications: { ...itemForm.specifications, [specKey]: specValue }
            });
            setSpecKey('');
            setSpecValue('');
        }
    };

    const removeSpecification = (key: string) => {
        const newSpecs = { ...itemForm.specifications };
        delete newSpecs[key];
        setItemForm({ ...itemForm, specifications: newSpecs });
    };

    const handleAddSeller = async () => {
        if (!sellerForm.name || !sellerForm.email || !sellerForm.password) {
            toast({
                title: 'Error',
                description: 'Please fill in all required fields',
                variant: 'destructive',
            });
            return;
        }

        if (sellerForm.password !== sellerForm.confirmPassword) {
            toast({
                title: 'Error',
                description: 'Passwords do not match',
                variant: 'destructive',
            });
            return;
        }

        if (sellerForm.password.length < 6) {
            toast({
                title: 'Error',
                description: 'Password must be at least 6 characters',
                variant: 'destructive',
            });
            return;
        }

        setIsCreatingSeller(true);
        try {
            const { user: newSeller, error } = await createSellerAccount(
                sellerForm.email,
                sellerForm.password,
                sellerForm.name
            );

            if (error) {
                toast({
                    title: 'Error',
                    description: error.message || 'Failed to create seller account',
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Success',
                    description: `Seller account created for ${sellerForm.name}. They can now login with their email and password.`,
                });
                setIsAddSellerDialogOpen(false);
                setSellerForm({ name: '', email: '', password: '', confirmPassword: '' });
                await fetchData();
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to create seller account',
                variant: 'destructive',
            });
        } finally {
            setIsCreatingSeller(false);
        }
    };

    if (authLoading || loading) {
        return (
            <DashboardLayout role="admin">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
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
        <DashboardLayout role="admin">
            <div className="relative min-h-[calc(100vh-4rem)]">
                {/* Background Effect - only visible in dark mode */}
                <div className="fixed inset-0 z-0 pointer-events-none opacity-50 hidden dark:block">
                    <BackgroundBeams />
                </div>

                <div className="relative z-10 space-y-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                                Admin Overview
                            </h1>
                            <p className="text-muted-foreground mt-1">Complete control over marketplace operations</p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all hover:scale-105"
                                onClick={() => setIsAddSellerDialogOpen(true)}
                            >
                                <UserPlus className="mr-2 h-4 w-4 text-rose-600" />
                                Add Seller
                            </Button>
                            <Button
                                className="bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white shadow-lg shadow-rose-500/20 transition-all hover:scale-105"
                                onClick={() => setIsAddItemDialogOpen(true)}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add New Item
                            </Button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="shadow-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all duration-300 group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
                                <div className="h-8 w-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Package className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalItems}</div>
                                <p className="text-xs text-muted-foreground mt-1">{stats.activeItems} active items</p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all duration-300 group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
                                <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <ShoppingCart className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalOrders}</div>
                                <p className="text-xs text-muted-foreground mt-1">{stats.pendingOrders} pending</p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all duration-300 group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                                <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">${stats.totalRevenue.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground mt-1">From completed orders</p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all duration-300 group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                                <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Users className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalUsers}</div>
                                <p className="text-xs text-muted-foreground mt-1">Registered users</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <Tabs defaultValue="items" className="space-y-6">
                        <TabsList className="bg-white dark:bg-gray-900 p-1 border border-gray-200 dark:border-gray-800 rounded-xl">
                            <TabsTrigger value="items" className="rounded-lg data-[state=active]:bg-rose-100 data-[state=active]:text-rose-700">Items</TabsTrigger>
                            <TabsTrigger value="orders" className="rounded-lg data-[state=active]:bg-rose-100 data-[state=active]:text-rose-700">Orders</TabsTrigger>
                            <TabsTrigger value="bids" className="rounded-lg data-[state=active]:bg-rose-100 data-[state=active]:text-rose-700">Bids</TabsTrigger>
                            <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-rose-100 data-[state=active]:text-rose-700">Users</TabsTrigger>
                        </TabsList>

                        {/* Items Tab */}
                        <TabsContent value="items" className="space-y-6">
                            <div className="grid gap-6">
                                {items.map((item) => (
                                    <Card key={item.id} className="shadow-md hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 group">
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <CardTitle className="flex items-center gap-2">
                                                        {item.name}
                                                        <Badge variant="outline" className={getStatusColor(item.status)}>{item.status}</Badge>
                                                    </CardTitle>
                                                    <CardDescription>{item.description}</CardDescription>
                                                </div>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="outline" size="icon" onClick={() => openEditDialog(item)} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="destructive" size="icon">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Item</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure you want to delete "{item.name}"? This action cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeleteItem(item.id)} className="bg-red-600 hover:bg-red-700">
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                                <div className="p-3 bg-rose-50 dark:bg-rose-900/10 rounded-lg border border-rose-100 dark:border-rose-900/20">
                                                    <Label className="text-xs text-rose-600 dark:text-rose-400 uppercase tracking-wider">Price</Label>
                                                    <p className="text-lg font-bold text-rose-600 dark:text-rose-400">${item.price}</p>
                                                </div>
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Size</Label>
                                                    <p className="font-medium">{item.size}</p>
                                                </div>
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Category</Label>
                                                    <p className="font-medium">{item.category}</p>
                                                </div>
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Condition</Label>
                                                    <p className="font-medium capitalize">{item.condition}</p>
                                                </div>
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Stock</Label>
                                                    <p className="font-medium">{item.quantity} units</p>
                                                </div>
                                            </div>
                                            {Object.keys(item.specifications).length > 0 && (
                                                <div className="mt-4">
                                                    <Label className="font-semibold mb-2 block text-sm uppercase tracking-wider text-gray-500">Specifications</Label>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                        {Object.entries(item.specifications).map(([key, value]) => (
                                                            <div key={key} className="bg-white dark:bg-gray-950 p-2 rounded border border-gray-100 dark:border-gray-800 text-sm">
                                                                <p className="text-muted-foreground text-xs">{key}</p>
                                                                <p className="font-medium">{value}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Orders Tab */}
                        <TabsContent value="orders" className="space-y-6">
                            <div className="grid gap-6">
                                {orders.map((order) => (
                                    <Card key={order.id} className="shadow-md hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 group">
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle className="flex items-center gap-2">
                                                        Order #{order.id}
                                                        <Badge variant="outline" className={getStatusColor(order.status)}>{order.status}</Badge>
                                                    </CardTitle>
                                                    <CardDescription>
                                                        {order.item?.name} • Buyer: {order.buyer?.name}
                                                    </CardDescription>
                                                </div>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Order</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete order #{order.id}? This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteOrder(order.id)} className="bg-red-600 hover:bg-red-700">
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Quantity</Label>
                                                    <p className="font-medium">{order.quantity} units</p>
                                                </div>
                                                <div className="p-3 bg-rose-50 dark:bg-rose-900/10 rounded-lg border border-rose-100 dark:border-rose-900/20">
                                                    <Label className="text-xs text-rose-600 dark:text-rose-400 uppercase tracking-wider">Total Price</Label>
                                                    <p className="font-bold text-rose-600 dark:text-rose-400">${order.totalPrice.toFixed(2)}</p>
                                                </div>
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Created</Label>
                                                    <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Updated</Label>
                                                    <p className="font-medium">{new Date(order.updatedAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Shipping Address</Label>
                                                <p className="font-medium">{order.shippingAddress}</p>
                                            </div>
                                            {order.notes && (
                                                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Notes</Label>
                                                    <p className="font-medium">{order.notes}</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Bids Tab */}
                        <TabsContent value="bids" className="space-y-6">
                            <div className="grid gap-6">
                                {bids.map((bid) => (
                                    <Card key={bid.id} className="shadow-md hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle className="flex items-center gap-2">
                                                        Bid #{bid.id}
                                                        <Badge variant="outline" className={getStatusColor(bid.status)}>{bid.status}</Badge>
                                                    </CardTitle>
                                                    <CardDescription>
                                                        Order #{bid.orderId} • Seller: {bid.seller?.name}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                <div className="p-3 bg-rose-50 dark:bg-rose-900/10 rounded-lg border border-rose-100 dark:border-rose-900/20">
                                                    <Label className="text-xs text-rose-600 dark:text-rose-400 uppercase tracking-wider">Bid Amount</Label>
                                                    <p className="text-lg font-bold text-rose-600 dark:text-rose-400">${bid.bidAmount.toFixed(2)}</p>
                                                </div>
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Estimated Delivery</Label>
                                                    <p className="font-medium">{new Date(bid.estimatedDelivery).toLocaleDateString()}</p>
                                                </div>
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Created</Label>
                                                    <p className="font-medium">{new Date(bid.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            {bid.message && (
                                                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Message</Label>
                                                    <p className="font-medium mt-1">"{bid.message}"</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Users Tab */}
                        <TabsContent value="users" className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {users.map((user) => (
                                    <Card key={user.id} className="shadow-md hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 group">
                                        <CardHeader>
                                            <div className="flex items-center gap-4">
                                                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-rose-500/20 group-hover:scale-110 transition-transform">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <CardTitle>{user.name}</CardTitle>
                                                    <CardDescription>{user.email}</CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Role</Label>
                                                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                                                    {user.role}
                                                </Badge>
                                            </div>
                                            {user.phone && (
                                                <div className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Phone</Label>
                                                    <p className="font-medium text-sm">{user.phone}</p>
                                                </div>
                                            )}
                                            {user.address && (
                                                <div className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Address</Label>
                                                    <p className="font-medium text-sm truncate">{user.address}</p>
                                                </div>
                                            )}
                                            <div className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Joined</Label>
                                                <p className="font-medium text-sm">{new Date(user.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Add Item Dialog */}
                    <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Add New Item</DialogTitle>
                                <DialogDescription>Create a new item in the marketplace</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="name">Item Name</Label>
                                        <Input
                                            id="name"
                                            value={itemForm.name}
                                            onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                                            placeholder="e.g., Fresh Organic Tomatoes"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="price">Price ($)</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            step="0.01"
                                            value={itemForm.price}
                                            onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={itemForm.description}
                                        onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                                        placeholder="Detailed description of the item"
                                        rows={3}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="size">Size</Label>
                                        <Input
                                            id="size"
                                            value={itemForm.size}
                                            onChange={(e) => setItemForm({ ...itemForm, size: e.target.value })}
                                            placeholder="e.g., 1 kg, Large, 15 inch"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="category">Category</Label>
                                        <Input
                                            id="category"
                                            value={itemForm.category}
                                            onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                                            placeholder="e.g., Vegetables, Electronics"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="condition">Condition</Label>
                                        <Select value={itemForm.condition} onValueChange={(value: any) => setItemForm({ ...itemForm, condition: value })}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="new">New</SelectItem>
                                                <SelectItem value="used">Used</SelectItem>
                                                <SelectItem value="refurbished">Refurbished</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="quantity">Quantity</Label>
                                        <Input
                                            id="quantity"
                                            type="number"
                                            value={itemForm.quantity}
                                            onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label className="mb-2 block">Specifications</Label>
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Key (e.g., Origin)"
                                                value={specKey}
                                                onChange={(e) => setSpecKey(e.target.value)}
                                            />
                                            <Input
                                                placeholder="Value (e.g., Local Farm)"
                                                value={specValue}
                                                onChange={(e) => setSpecValue(e.target.value)}
                                            />
                                            <Button type="button" onClick={addSpecification}>Add</Button>
                                        </div>
                                        {Object.entries(itemForm.specifications).length > 0 && (
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                {Object.entries(itemForm.specifications).map(([key, value]) => (
                                                    <div key={key} className="bg-muted p-2 rounded flex items-center justify-between">
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">{key}</p>
                                                            <p className="text-sm font-medium">{value}</p>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={() => removeSpecification(key)}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => { setIsAddItemDialogOpen(false); resetItemForm(); }}>
                                    Cancel
                                </Button>
                                <Button
                                    className="bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white shadow-lg shadow-rose-500/20"
                                    onClick={handleAddItem}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Item
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Add Seller Dialog */}
                    <Dialog open={isAddSellerDialogOpen} onOpenChange={setIsAddSellerDialogOpen}>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <UserPlus className="h-5 w-5 text-rose-600" />
                                    Add New Seller
                                </DialogTitle>
                                <DialogDescription>
                                    Create a seller account. The seller will be able to login with these credentials.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="seller-name">Full Name *</Label>
                                    <Input
                                        id="seller-name"
                                        value={sellerForm.name}
                                        onChange={(e) => setSellerForm({ ...sellerForm, name: e.target.value })}
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="seller-email">Email Address *</Label>
                                    <Input
                                        id="seller-email"
                                        type="email"
                                        value={sellerForm.email}
                                        onChange={(e) => setSellerForm({ ...sellerForm, email: e.target.value })}
                                        placeholder="seller@example.com"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="seller-password">Password *</Label>
                                    <Input
                                        id="seller-password"
                                        type="password"
                                        value={sellerForm.password}
                                        onChange={(e) => setSellerForm({ ...sellerForm, password: e.target.value })}
                                        placeholder="Min. 6 characters"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="seller-confirm-password">Confirm Password *</Label>
                                    <Input
                                        id="seller-confirm-password"
                                        type="password"
                                        value={sellerForm.confirmPassword}
                                        onChange={(e) => setSellerForm({ ...sellerForm, confirmPassword: e.target.value })}
                                        placeholder="Confirm password"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsAddSellerDialogOpen(false);
                                        setSellerForm({ name: '', email: '', password: '', confirmPassword: '' });
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white shadow-lg shadow-rose-500/20"
                                    onClick={handleAddSeller}
                                    disabled={isCreatingSeller}
                                >
                                    {isCreatingSeller ? (
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                            Creating...
                                        </div>
                                    ) : (
                                        <>
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Create Seller
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Edit Item Dialog */}
                    <Dialog open={isEditItemDialogOpen} onOpenChange={setIsEditItemDialogOpen}>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Edit Item</DialogTitle>
                                <DialogDescription>Update item details</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="edit-name">Item Name</Label>
                                        <Input
                                            id="edit-name"
                                            value={itemForm.name}
                                            onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="edit-price">Price ($)</Label>
                                        <Input
                                            id="edit-price"
                                            type="number"
                                            step="0.01"
                                            value={itemForm.price}
                                            onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="edit-description">Description</Label>
                                    <Textarea
                                        id="edit-description"
                                        value={itemForm.description}
                                        onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="edit-size">Size</Label>
                                        <Input
                                            id="edit-size"
                                            value={itemForm.size}
                                            onChange={(e) => setItemForm({ ...itemForm, size: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="edit-category">Category</Label>
                                        <Input
                                            id="edit-category"
                                            value={itemForm.category}
                                            onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="edit-condition">Condition</Label>
                                        <Select value={itemForm.condition} onValueChange={(value: any) => setItemForm({ ...itemForm, condition: value })}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="new">New</SelectItem>
                                                <SelectItem value="used">Used</SelectItem>
                                                <SelectItem value="refurbished">Refurbished</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="edit-quantity">Quantity</Label>
                                        <Input
                                            id="edit-quantity"
                                            type="number"
                                            value={itemForm.quantity}
                                            onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label className="mb-2 block">Specifications</Label>
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Key"
                                                value={specKey}
                                                onChange={(e) => setSpecKey(e.target.value)}
                                            />
                                            <Input
                                                placeholder="Value"
                                                value={specValue}
                                                onChange={(e) => setSpecValue(e.target.value)}
                                            />
                                            <Button type="button" onClick={addSpecification}>Add</Button>
                                        </div>
                                        {Object.entries(itemForm.specifications).length > 0 && (
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                {Object.entries(itemForm.specifications).map(([key, value]) => (
                                                    <div key={key} className="bg-muted p-2 rounded flex items-center justify-between">
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">{key}</p>
                                                            <p className="text-sm font-medium">{value}</p>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={() => removeSpecification(key)}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => { setIsEditItemDialogOpen(false); resetItemForm(); }}>
                                    Cancel
                                </Button>
                                <Button
                                    className="bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white shadow-lg shadow-rose-500/20"
                                    onClick={handleEditItem}
                                >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Update Item
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </DashboardLayout>
    );
}
