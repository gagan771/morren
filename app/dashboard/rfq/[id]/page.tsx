"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  getRFQById,
  getSuppliers,
  addInviteToRFQ,
  awardRFQ,
  generateInviteUrl,
  getLowestQuote,
  calculatePercentageDiff,
  type RFQ,
  type Supplier,
  type Quote,
} from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { format } from "date-fns"
import {
  ArrowLeft,
  Copy,
  Check,
  Send,
  Award,
  RefreshCw,
  ExternalLink,
  Users,
  FileText,
  Clock,
  TrendingDown,
  Trophy,
} from "lucide-react"

const statusConfig: Record<string, { label: string; color: string }> = {
  INVITE_SENT: { label: "Invite Sent", color: "bg-blue-100 text-blue-700" },
  VIEWED: { label: "Viewed", color: "bg-yellow-100 text-yellow-700" },
  QUOTED: { label: "Quoted", color: "bg-green-100 text-green-700" },
  UPDATED: { label: "Updated", color: "bg-purple-100 text-purple-700" },
}

export default function RFQDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [rfq, setRfq] = useState<RFQ | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([])
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [awardDialogOpen, setAwardDialogOpen] = useState(false)
  const [selectedWinner, setSelectedWinner] = useState<Quote | null>(null)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  const loadData = useCallback(() => {
    const rfqData = getRFQById(params.id as string)
    if (!rfqData) {
      router.push("/dashboard")
      return
    }
    setRfq(rfqData)
    setSuppliers(getSuppliers())
    setLoading(false)
  }, [params.id, router])

  useEffect(() => {
    loadData()
    // Simulate live updates by polling every 5 seconds
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [loadData])

  const handleInviteSuppliers = () => {
    if (selectedSuppliers.length < 3 || selectedSuppliers.length > 5) {
      toast({
        title: "Invalid Selection",
        description: "Please select 3-5 suppliers to invite.",
        variant: "destructive",
      })
      return
    }

    selectedSuppliers.forEach((supplierId) => {
      addInviteToRFQ(rfq!.id, supplierId)
    })

    loadData()
    setSelectedSuppliers([])
    setInviteDialogOpen(false)
    toast({
      title: "Invites Sent",
      description: `Successfully invited ${selectedSuppliers.length} suppliers.`,
    })
  }

  const copyInviteLink = async (token: string) => {
    const url = generateInviteUrl(token)
    await navigator.clipboard.writeText(url)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
    toast({
      title: "Link Copied",
      description: "Invite link copied to clipboard.",
    })
  }

  const handleAwardRFQ = () => {
    if (!selectedWinner || !rfq) return

    awardRFQ(rfq.id, selectedWinner.supplierId, selectedWinner.supplierName, selectedWinner.pricePerUnit)
    loadData()
    setAwardDialogOpen(false)
    toast({
      title: "RFQ Awarded",
      description: `Successfully awarded to ${selectedWinner.supplierName}.`,
    })
  }

  if (loading || !rfq) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    )
  }

  const lowestQuote = getLowestQuote(rfq.quotes)
  const availableSuppliers = suppliers.filter((s) => !rfq.invites.some((i) => i.supplierId === s.id))
  const sortedQuotes = [...rfq.quotes].sort((a, b) => a.pricePerUnit - b.pricePerUnit)

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <Toaster />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to RFQs
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{rfq.productName}</h1>
            <Badge variant={rfq.status === "AWARDED" ? "default" : rfq.status === "OPEN" ? "secondary" : "outline"}>
              {rfq.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">{rfq.specs}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {rfq.status !== "AWARDED" && availableSuppliers.length > 0 && (
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Send className="h-4 w-4 mr-2" />
                  Invite Suppliers
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Invite Suppliers</DialogTitle>
                  <DialogDescription>Select 3-5 suppliers to invite for this RFQ.</DialogDescription>
                </DialogHeader>
                <div className="max-h-80 overflow-y-auto space-y-2 py-4">
                  {availableSuppliers.map((supplier) => (
                    <label
                      key={supplier.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedSuppliers.includes(supplier.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSuppliers((prev) => [...prev, supplier.id])
                          } else {
                            setSelectedSuppliers((prev) => prev.filter((id) => id !== supplier.id))
                          }
                        }}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{supplier.name}</div>
                        <div className="text-sm text-muted-foreground">{supplier.email}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <DialogFooter>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm text-muted-foreground">
                      {selectedSuppliers.length} selected (3-5 required)
                    </span>
                    <Button
                      onClick={handleInviteSuppliers}
                      disabled={selectedSuppliers.length < 3 || selectedSuppliers.length > 5}
                    >
                      Send Invites
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* RFQ Info Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Quantity</div>
            <div className="text-xl font-bold text-foreground">
              {rfq.quantity} {rfq.unit}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Required By</div>
            <div className="text-xl font-bold text-foreground">{format(new Date(rfq.requiredByDate), "MMM dd")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Invites</div>
            <div className="text-xl font-bold text-foreground">{rfq.invites.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Quotes</div>
            <div className="text-xl font-bold text-foreground">{rfq.quotes.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Awarded Banner */}
      {rfq.status === "AWARDED" && rfq.awardedTo && (
        <Card className="bg-success/10 border-success/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-success" />
              </div>
              <div>
                <div className="font-medium text-foreground">Awarded to {rfq.awardedTo.supplierName}</div>
                <div className="text-sm text-muted-foreground">
                  Winning price: ₹{rfq.awardedTo.price.toLocaleString()}/unit • Awarded on{" "}
                  {format(new Date(rfq.awardedTo.awardedAt), "MMM dd, yyyy")}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="quotes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="quotes" className="gap-2">
            <TrendingDown className="h-4 w-4" />
            Quotes ({rfq.quotes.length})
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-2">
            <Users className="h-4 w-4" />
            Invited Suppliers ({rfq.invites.length})
          </TabsTrigger>
          <TabsTrigger value="details" className="gap-2">
            <FileText className="h-4 w-4" />
            RFQ Details
          </TabsTrigger>
        </TabsList>

        {/* Quotes Tab */}
        <TabsContent value="quotes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Quote Comparison</CardTitle>
                <CardDescription>All received quotes sorted by lowest price</CardDescription>
              </div>
              {lowestQuote && (
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Lowest Bid</div>
                  <div className="text-xl font-bold text-success">
                    ₹{lowestQuote.pricePerUnit.toLocaleString()}/unit
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {rfq.quotes.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No quotes yet</h3>
                  <p className="text-muted-foreground">Waiting for suppliers to submit their quotes.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead className="text-right">Price/Unit</TableHead>
                        <TableHead className="text-right">Total Price</TableHead>
                        <TableHead className="text-right">Delivery</TableHead>
                        <TableHead className="text-right">Validity</TableHead>
                        <TableHead className="text-right">Diff</TableHead>
                        {rfq.status !== "AWARDED" && <TableHead className="text-right">Action</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedQuotes.map((quote, index) => {
                        const isLowest = index === 0
                        const diff = lowestQuote
                          ? calculatePercentageDiff(quote.pricePerUnit, lowestQuote.pricePerUnit)
                          : 0
                        const isWinner = rfq.awardedTo?.supplierId === quote.supplierId

                        return (
                          <TableRow
                            key={quote.id}
                            className={isLowest ? "bg-success/5" : isWinner ? "bg-primary/5" : ""}
                          >
                            <TableCell>
                              {isLowest ? (
                                <Badge className="bg-success text-success-foreground">
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                  Lowest
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">#{index + 1}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">{quote.supplierName}</span>
                                {isWinner && (
                                  <Badge variant="outline" className="text-success border-success">
                                    <Trophy className="h-3 w-3 mr-1" />
                                    Winner
                                  </Badge>
                                )}
                              </div>
                              {quote.notes && (
                                <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                  {quote.notes}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ₹{quote.pricePerUnit.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">₹{quote.totalPrice.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{quote.deliveryDays} days</TableCell>
                            <TableCell className="text-right">{quote.validityDays} days</TableCell>
                            <TableCell className="text-right">
                              {isLowest ? (
                                <span className="text-success">-</span>
                              ) : (
                                <span className="text-destructive">+{diff.toFixed(1)}%</span>
                              )}
                            </TableCell>
                            {rfq.status !== "AWARDED" && (
                              <TableCell className="text-right">
                                <Dialog
                                  open={awardDialogOpen && selectedWinner?.id === quote.id}
                                  onOpenChange={(open) => {
                                    setAwardDialogOpen(open)
                                    if (!open) setSelectedWinner(null)
                                  }}
                                >
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => setSelectedWinner(quote)}>
                                      <Award className="h-4 w-4 mr-1" />
                                      Award
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Award RFQ</DialogTitle>
                                      <DialogDescription>
                                        Are you sure you want to award this RFQ to {quote.supplierName}?
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4 space-y-3">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Supplier</span>
                                        <span className="font-medium">{quote.supplierName}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Price per Unit</span>
                                        <span className="font-medium">₹{quote.pricePerUnit.toLocaleString()}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Price</span>
                                        <span className="font-medium">₹{quote.totalPrice.toLocaleString()}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Delivery</span>
                                        <span className="font-medium">{quote.deliveryDays} days</span>
                                      </div>
                                    </div>
                                    <DialogFooter>
                                      <Button variant="outline" onClick={() => setAwardDialogOpen(false)}>
                                        Cancel
                                      </Button>
                                      <Button onClick={handleAwardRFQ}>
                                        <Award className="h-4 w-4 mr-2" />
                                        Confirm Award
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </TableCell>
                            )}
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers">
          <Card>
            <CardHeader>
              <CardTitle>Invited Suppliers</CardTitle>
              <CardDescription>Track supplier invite status and share links</CardDescription>
            </CardHeader>
            <CardContent>
              {rfq.invites.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No suppliers invited</h3>
                  <p className="text-muted-foreground mb-4">Invite suppliers to start receiving quotes.</p>
                  <Button onClick={() => setInviteDialogOpen(true)}>
                    <Send className="h-4 w-4 mr-2" />
                    Invite Suppliers
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {rfq.invites.map((invite) => {
                    const supplier = suppliers.find((s) => s.id === invite.supplierId)
                    const status = statusConfig[invite.status]
                    const inviteUrl = generateInviteUrl(invite.inviteToken)

                    return (
                      <div
                        key={invite.id}
                        className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 rounded-lg border border-border"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground">{supplier?.name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {supplier?.email} • {supplier?.phone}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input value={inviteUrl} readOnly className="w-full lg:w-64 text-xs bg-muted" />
                          <Button variant="outline" size="icon" onClick={() => copyInviteLink(invite.inviteToken)}>
                            {copiedToken === invite.inviteToken ? (
                              <Check className="h-4 w-4 text-success" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button variant="outline" size="icon" asChild>
                            <a href={inviteUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>RFQ Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Product Name</div>
                  <div className="font-medium text-foreground">{rfq.productName}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Quantity</div>
                  <div className="font-medium text-foreground">
                    {rfq.quantity} {rfq.unit}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Required By</div>
                  <div className="font-medium text-foreground">
                    {format(new Date(rfq.requiredByDate), "MMMM dd, yyyy")}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Created On</div>
                  <div className="font-medium text-foreground">{format(new Date(rfq.createdAt), "MMMM dd, yyyy")}</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Specifications</div>
                <div className="font-medium text-foreground whitespace-pre-wrap">{rfq.specs}</div>
              </div>
              {rfq.notes && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Additional Notes</div>
                  <div className="font-medium text-foreground whitespace-pre-wrap">{rfq.notes}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
