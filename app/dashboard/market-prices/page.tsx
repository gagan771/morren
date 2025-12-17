"use client"

import { useState, useEffect } from "react"
import { getMarketPrices, addMarketPrice, getRFQs, type MarketPrice, type RFQ, type Quote } from "@/lib/supabase-api"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { format, subDays } from "date-fns"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts"
import { Plus, TrendingUp, Calendar, BarChart3 } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

export default function MarketPricesPage() {
  const { toast } = useToast()
  const { resolvedTheme } = useTheme()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [prices, setPrices] = useState<MarketPrice[]>([])
  const [rfqs, setRfqs] = useState<RFQ[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<string>("All Products")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newPrice, setNewPrice] = useState({ productName: "", price: "" })

  const isDark = resolvedTheme === "dark"

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth?role=buyer')
      return
    }
    if (user && user.role !== 'buyer') {
      router.push(`/dashboard/${user.role}`)
      return
    }
    if (user) {
      fetchData()
    }
  }, [user, authLoading, router])

  const fetchData = async () => {
    if (!user) return
    try {
      setLoading(true)
      const [pricesData, rfqsData] = await Promise.all([
        getMarketPrices(),
        getRFQs(user.id),
      ])
      setPrices(pricesData)
      setRfqs(rfqsData)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "Failed to load market prices.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Get unique product names from both prices and RFQs
  const productNames = [...new Set([...prices.map((p) => p.productName), ...rfqs.map((r) => r.productName)])]

  // Filter prices for selected product
  const filteredPrices =
    selectedProduct === "All Products"
      ? prices
      : prices.filter((p) => p.productName.toLowerCase() === selectedProduct.toLowerCase())

  // Prepare chart data (last 30 days)
  const chartData = filteredPrices
    .filter((p) => new Date(p.date) >= subDays(new Date(), 30))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((p) => ({
      date: format(new Date(p.date), "MMM dd"),
      price: p.price,
      fullDate: format(new Date(p.date), "MMM dd, yyyy"),
    }))

  // Get RFQ quotes for comparison
  const rfqQuotes =
    selectedProduct === "All Products"
      ? []
      : rfqs
          .filter((r) => r.productName.toLowerCase() === selectedProduct.toLowerCase())
          .flatMap((r) =>
            r.quotes.map((q: Quote) => ({
              supplier: q.supplierName,
              price: q.pricePerUnit,
              date: new Date(q.submittedAt),
            })),
          )

  const handleAddPrice = async () => {
    if (!newPrice.productName || !newPrice.price) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      })
      return
    }

    try {
      await addMarketPrice(newPrice.productName, Number.parseFloat(newPrice.price))
      await fetchData()
      setNewPrice({ productName: "", price: "" })
      setDialogOpen(false)
      toast({
        title: "Price Added",
        description: `Successfully added market price for ${newPrice.productName}.`,
      })
    } catch (error) {
      console.error('Error adding market price:', error)
      toast({
        title: "Error",
        description: "Failed to add market price. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (authLoading || loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading market prices...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <Toaster />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Market Prices</h1>
          <p className="text-muted-foreground mt-1">Track and analyze market price trends</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Market Price
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Market Price</DialogTitle>
              <DialogDescription>Record a new market price for a product</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name</Label>
                <Input
                  id="productName"
                  value={newPrice.productName}
                  onChange={(e) => setNewPrice({ ...newPrice, productName: e.target.value })}
                  placeholder="e.g., Wheat, Steel Bars"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={newPrice.price}
                  onChange={(e) => setNewPrice({ ...newPrice, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddPrice}>Add Price</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Product Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="productFilter">Filter by Product:</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger id="productFilter" className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Products">All Products</SelectItem>
                {productNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Price Trend (Last 30 Days)
            </CardTitle>
            <CardDescription>
              {selectedProduct === "All Products" ? "All products" : selectedProduct}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
                <XAxis dataKey="date" stroke={isDark ? "#9ca3af" : "#6b7280"} />
                <YAxis stroke={isDark ? "#9ca3af" : "#6b7280"} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#1f2937" : "#ffffff",
                    border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Market Price (₹)"
                  dot={{ fill: "#3b82f6", r: 4 }}
                />
                {rfqQuotes.length > 0 && (
                  <Line
                    type="monotone"
                    dataKey="quotePrice"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="RFQ Quotes (₹)"
                    dot={{ fill: "#10b981", r: 4 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Price Table */}
      <Card>
        <CardHeader>
          <CardTitle>Price History</CardTitle>
          <CardDescription>All recorded market prices</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPrices.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No prices recorded</h3>
              <p className="text-muted-foreground mb-4">Start tracking market prices by adding your first entry.</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Market Price
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Price (₹)</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrices
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((price) => (
                      <TableRow key={price.id}>
                        <TableCell className="font-medium">{price.productName}</TableCell>
                        <TableCell>
                          <span className="font-bold text-primary">₹{price.price.toLocaleString()}</span>
                        </TableCell>
                        <TableCell>{format(new Date(price.date), "MMM dd, yyyy")}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
