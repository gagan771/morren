"use client"

import { useState, useEffect } from "react"
import { getMarketPrices, addMarketPrice, getRFQs, type MarketPrice, type RFQ } from "@/lib/store"
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
  const [prices, setPrices] = useState<MarketPrice[]>([])
  const [rfqs, setRfqs] = useState<RFQ[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>("All Products")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newPrice, setNewPrice] = useState({ productName: "", price: "" })

  const isDark = resolvedTheme === "dark"

  useEffect(() => {
    setPrices(getMarketPrices())
    setRfqs(getRFQs())
  }, [])

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
            r.quotes.map((q) => ({
              supplier: q.supplierName,
              price: q.pricePerUnit,
              date: new Date(q.submittedAt),
            })),
          )

  const handleAddPrice = () => {
    if (!newPrice.productName || !newPrice.price) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      })
      return
    }

    addMarketPrice(newPrice.productName, Number.parseFloat(newPrice.price))
    setPrices(getMarketPrices())
    setNewPrice({ productName: "", price: "" })
    setDialogOpen(false)
    toast({
      title: "Price Added",
      description: "Market price has been recorded.",
    })
  }

  // Calculate stats
  const avgPrice =
    filteredPrices.length > 0 ? filteredPrices.reduce((sum, p) => sum + p.price, 0) / filteredPrices.length : 0
  const latestPrice =
    filteredPrices.length > 0
      ? filteredPrices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.price
      : 0
  const lowestQuote = rfqQuotes.length > 0 ? Math.min(...rfqQuotes.map((q) => q.price)) : null

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <Toaster />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Market Price History</h1>
          <p className="text-muted-foreground mt-1">Track and compare market prices with RFQ quotes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Daily Price
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Market Price</DialogTitle>
              <DialogDescription>Record today's market price for a product.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name</Label>
                <Input
                  id="productName"
                  value={newPrice.productName}
                  onChange={(e) => setNewPrice((prev) => ({ ...prev, productName: e.target.value }))}
                  placeholder="e.g., Wheat, Steel, Cotton"
                  list="product-suggestions"
                />
                <datalist id="product-suggestions">
                  {productNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price per Unit (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPrice.price}
                  onChange={(e) => setNewPrice((prev) => ({ ...prev, price: e.target.value }))}
                  placeholder="e.g., 2500"
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
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="product-filter" className="text-sm text-muted-foreground mb-2 block">
                Filter by Product
              </Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger id="product-filter" className="w-full sm:w-64">
                  <SelectValue placeholder="All Products" />
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
            {selectedProduct !== "All Products" && (
              <div className="flex gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Latest Market Price</div>
                  <div className="text-xl font-bold text-foreground">
                    {latestPrice ? `₹${latestPrice.toLocaleString()}` : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Avg (30 days)</div>
                  <div className="text-xl font-bold text-foreground">
                    {avgPrice ? `₹${avgPrice.toLocaleString()}` : "-"}
                  </div>
                </div>
                {lowestQuote && (
                  <div>
                    <div className="text-sm text-muted-foreground">Lowest RFQ Quote</div>
                    <div className="text-xl font-bold text-success">₹{lowestQuote.toLocaleString()}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{prices.length}</div>
                <div className="text-sm text-muted-foreground">Price Records</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{productNames.length}</div>
                <div className="text-sm text-muted-foreground">Products Tracked</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-warning" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{chartData.length}</div>
                <div className="text-sm text-muted-foreground">Last 30 Days</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{rfqQuotes.length}</div>
                <div className="text-sm text-muted-foreground">RFQ Quotes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Price Trend (Last 30 Days)</CardTitle>
          <CardDescription>
            {selectedProduct !== "All Products"
              ? `Market prices for ${selectedProduct}`
              : "Select a product to view price trends"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No price data</h3>
              <p className="text-muted-foreground">
                {selectedProduct !== "All Products"
                  ? `No price records found for ${selectedProduct}.`
                  : "Select a product or add price records to see the trend."}
              </p>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e2e8f0"} />
                  <XAxis dataKey="date" stroke={isDark ? "#9ca3af" : "#64748b"} fontSize={12} />
                  <YAxis stroke={isDark ? "#9ca3af" : "#64748b"} fontSize={12} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? "#1f2937" : "#ffffff",
                      border: `1px solid ${isDark ? "#374151" : "#e2e8f0"}`,
                      borderRadius: "8px",
                      color: isDark ? "#f9fafb" : "#1f2937",
                    }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, "Market Price"]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={isDark ? "#60a5fa" : "#0066cc"}
                    strokeWidth={2}
                    dot={{ fill: isDark ? "#60a5fa" : "#0066cc", strokeWidth: 2 }}
                    name="Market Price"
                  />
                  {lowestQuote && (
                    <ReferenceLine
                      y={lowestQuote}
                      stroke="#16a34a"
                      strokeDasharray="5 5"
                      label={{ value: `Lowest Quote: ₹${lowestQuote}`, fill: "#16a34a", fontSize: 12 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* RFQ Quotes Comparison */}
      {selectedProduct !== "All Products" && rfqQuotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>RFQ Quotes vs Market Price</CardTitle>
            <CardDescription>Compare supplier quotes with current market prices</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Quote Price</TableHead>
                  <TableHead className="text-right">vs Market</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfqQuotes
                  .sort((a, b) => a.price - b.price)
                  .map((quote, idx) => {
                    const diff = latestPrice ? ((quote.price - latestPrice) / latestPrice) * 100 : 0
                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{quote.supplier}</TableCell>
                        <TableCell className="text-right">₹{quote.price.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {latestPrice ? (
                            <Badge
                              variant={diff < 0 ? "default" : "secondary"}
                              className={diff < 0 ? "bg-success text-success-foreground" : ""}
                            >
                              {diff > 0 ? "+" : ""}
                              {diff.toFixed(1)}%
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {format(quote.date, "MMM dd")}
                        </TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Price History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Price History</CardTitle>
          <CardDescription>All recorded market prices</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPrices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No price records found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Price (₹/unit)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrices
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 20)
                    .map((price) => (
                      <TableRow key={price.id}>
                        <TableCell>{format(new Date(price.date), "MMM dd, yyyy")}</TableCell>
                        <TableCell className="font-medium">{price.productName}</TableCell>
                        <TableCell className="text-right">₹{price.price.toLocaleString()}</TableCell>
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
