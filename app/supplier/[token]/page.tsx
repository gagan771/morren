"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import {
  getRFQByInviteToken,
  markInviteViewed,
  submitQuote,
  getLowestQuote,
  calculatePercentageDiff,
  getBuyerProfile,
  type RFQ,
  type Supplier,
  type SupplierInvite,
  type BuyerProfile,
} from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { ThemeToggle } from "@/components/theme-toggle"
import { format } from "date-fns"
import {
  Building2,
  Package,
  Calendar,
  FileText,
  Send,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Trophy,
  RefreshCw,
  Edit,
} from "lucide-react"

export default function SupplierPortalPage() {
  const params = useParams()
  const token = params.token as string
  const { toast } = useToast()

  const [rfq, setRfq] = useState<RFQ | null>(null)
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [invite, setInvite] = useState<SupplierInvite | null>(null)
  const [buyerProfile, setBuyerProfile] = useState<BuyerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [allowUpdate, setAllowUpdate] = useState(true)
  const [editMode, setEditMode] = useState(false)

  const [formData, setFormData] = useState({
    pricePerUnit: "",
    totalPrice: "",
    deliveryDays: "",
    validityDays: "",
    notes: "",
  })

  const loadData = useCallback(() => {
    const data = getRFQByInviteToken(token)
    if (data) {
      setRfq(data.rfq)
      setSupplier(data.supplier)
      setInvite(data.invite)
      setBuyerProfile(getBuyerProfile())

      // Mark as viewed if first time
      if (data.invite.status === "INVITE_SENT") {
        markInviteViewed(token)
      }

      // Pre-fill form if already quoted
      const existingQuote = data.rfq.quotes.find((q) => q.supplierId === data.supplier.id)
      if (existingQuote) {
        setFormData({
          pricePerUnit: existingQuote.pricePerUnit.toString(),
          totalPrice: existingQuote.totalPrice.toString(),
          deliveryDays: existingQuote.deliveryDays.toString(),
          validityDays: existingQuote.validityDays.toString(),
          notes: existingQuote.notes || "",
        })
      }
    }
    setLoading(false)
  }, [token])

  useEffect(() => {
    loadData()
    // Poll for updates every 5 seconds for live bidding view
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [loadData])

  // Auto-calculate total price
  useEffect(() => {
    if (formData.pricePerUnit && rfq) {
      const total = Number.parseFloat(formData.pricePerUnit) * rfq.quantity
      setFormData((prev) => ({ ...prev, totalPrice: total.toFixed(2) }))
    }
  }, [formData.pricePerUnit, rfq])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rfq || !supplier) return

    setSubmitting(true)
    try {
      submitQuote(rfq.id, supplier.id, supplier.name, {
        pricePerUnit: Number.parseFloat(formData.pricePerUnit),
        totalPrice: Number.parseFloat(formData.totalPrice),
        deliveryDays: Number.parseInt(formData.deliveryDays),
        validityDays: Number.parseInt(formData.validityDays),
        notes: formData.notes || undefined,
      })

      loadData()
      setEditMode(false)
      toast({
        title: hasQuoted ? "Quote Updated" : "Quote Submitted",
        description: "Your quote has been submitted successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit quote. Please try again.",
        variant: "destructive",
      })
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse space-y-4 text-center">
          <div className="h-12 w-12 bg-muted rounded-full mx-auto" />
          <div className="h-4 bg-muted rounded w-32 mx-auto" />
        </div>
      </div>
    )
  }

  if (!rfq || !supplier || !invite) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">Invalid Link</h1>
            <p className="text-muted-foreground">
              This invite link is invalid or has expired. Please contact the buyer for a new link.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const lowestQuote = getLowestQuote(rfq.quotes)
  const myQuote = rfq.quotes.find((q) => q.supplierId === supplier.id)
  const hasQuoted = !!myQuote
  const isAwarded = rfq.status === "AWARDED"
  const isWinner = isAwarded && rfq.awardedTo?.supplierId === supplier.id
  const myDiff = myQuote && lowestQuote ? calculatePercentageDiff(myQuote.pricePerUnit, lowestQuote.pricePerUnit) : null
  const isLowestBidder = myQuote && lowestQuote && myQuote.pricePerUnit === lowestQuote.pricePerUnit

  return (
    <div className="min-h-screen bg-background">
      <Toaster />

      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-foreground">{buyerProfile?.companyName}</div>
                <div className="text-sm text-muted-foreground">RFQ Portal</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={loadData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Awarded Banner */}
        {isAwarded && (
          <Card className={isWinner ? "bg-success/10 border-success/30" : "bg-muted"}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {isWinner ? (
                  <>
                    <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">Congratulations! You have won this RFQ.</div>
                      <div className="text-sm text-muted-foreground">
                        The buyer will contact you with further details.
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-10 w-10 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">This RFQ has been awarded.</div>
                      <div className="text-sm text-muted-foreground">
                        Thank you for participating. Better luck next time!
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Supplier Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                <span className="font-medium text-foreground">{supplier.name.charAt(0)}</span>
              </div>
              <div>
                <div className="font-medium text-foreground">{supplier.name}</div>
                <div className="text-sm text-muted-foreground">{supplier.email}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RFQ Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{rfq.productName}</CardTitle>
                <CardDescription>Request for Quote</CardDescription>
              </div>
              <Badge variant={isAwarded ? "default" : "secondary"}>{rfq.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Quantity</div>
                  <div className="font-medium text-foreground">
                    {rfq.quantity} {rfq.unit}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Required By</div>
                  <div className="font-medium text-foreground">
                    {format(new Date(rfq.requiredByDate), "MMM dd, yyyy")}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">Specifications</div>
              <div className="text-foreground bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">{rfq.specs}</div>
            </div>

            {rfq.notes && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Additional Notes</div>
                <div className="text-foreground bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">{rfq.notes}</div>
              </div>
            )}

            <div className="flex items-start gap-3 pt-2">
              <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Buyer</div>
                <div className="font-medium text-foreground">{buyerProfile?.companyName}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Lowest Bid */}
        {lowestQuote && !isAwarded && (
          <Card className="bg-accent/30 border-accent">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                    <TrendingDown className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Current Lowest Bid</div>
                    <div className="text-xl font-bold text-foreground">
                      ₹{lowestQuote.pricePerUnit.toLocaleString()}/unit
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {rfq.quotes.length} {rfq.quotes.length === 1 ? "quote" : "quotes"} received
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Realtime Feedback Panel (after submission) */}
        {hasQuoted && !isAwarded && (
          <Card className={isLowestBidder ? "bg-success/10 border-success/30" : "bg-warning/10 border-warning/30"}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    isLowestBidder ? "bg-success/20" : "bg-warning/20"
                  }`}
                >
                  {isLowestBidder ? (
                    <TrendingDown className="h-5 w-5 text-success" />
                  ) : (
                    <TrendingUp className="h-5 w-5 text-warning" />
                  )}
                </div>
                <div className="flex-1">
                  {isLowestBidder ? (
                    <>
                      <div className="font-medium text-foreground">You are the lowest bidder right now!</div>
                      <div className="text-sm text-muted-foreground">
                        Your quote: ₹{myQuote.pricePerUnit.toLocaleString()}/unit
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="font-medium text-foreground">
                        You are {myDiff?.toFixed(1)}% above the lowest bid
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Your quote: ₹{myQuote.pricePerUnit.toLocaleString()}/unit • Lowest: ₹
                        {lowestQuote?.pricePerUnit.toLocaleString()}/unit
                      </div>
                    </>
                  )}
                </div>
                {allowUpdate && !editMode && (
                  <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Update
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quote Form */}
        {!isAwarded && (!hasQuoted || editMode) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {hasQuoted ? "Update Your Quote" : "Submit Your Quote"}
              </CardTitle>
              <CardDescription>
                {hasQuoted ? "Revise your pricing to stay competitive" : "Enter your pricing and delivery details"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pricePerUnit">Price per Unit (₹) *</Label>
                    <Input
                      id="pricePerUnit"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.pricePerUnit}
                      onChange={(e) => setFormData((prev) => ({ ...prev, pricePerUnit: e.target.value }))}
                      placeholder="e.g., 2500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalPrice">Total Price (₹) *</Label>
                    <Input
                      id="totalPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.totalPrice}
                      onChange={(e) => setFormData((prev) => ({ ...prev, totalPrice: e.target.value }))}
                      placeholder="Auto-calculated"
                      required
                      readOnly
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      {rfq.quantity} {rfq.unit} × ₹{formData.pricePerUnit || 0}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deliveryDays">Delivery Days *</Label>
                    <Input
                      id="deliveryDays"
                      type="number"
                      min="1"
                      value={formData.deliveryDays}
                      onChange={(e) => setFormData((prev) => ({ ...prev, deliveryDays: e.target.value }))}
                      placeholder="e.g., 7"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="validityDays">Quote Validity (Days) *</Label>
                    <Input
                      id="validityDays"
                      type="number"
                      min="1"
                      value={formData.validityDays}
                      onChange={(e) => setFormData((prev) => ({ ...prev, validityDays: e.target.value }))}
                      placeholder="e.g., 30"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional information for the buyer..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  {editMode && (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => setEditMode(false)}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button type="submit" className="flex-1" disabled={submitting}>
                    <Send className="h-4 w-4 mr-2" />
                    {submitting ? "Submitting..." : hasQuoted ? "Update Quote" : "Submit Quote"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Quote Details (when submitted and not editing) */}
        {hasQuoted && !editMode && !isAwarded && (
          <Card>
            <CardHeader>
              <CardTitle>Your Quote Details</CardTitle>
              <CardDescription>
                Submitted on {format(new Date(myQuote.submittedAt), "MMM dd, yyyy h:mm a")}
                {myQuote.updatedAt && (
                  <span className="ml-2">(Updated: {format(new Date(myQuote.updatedAt), "MMM dd, yyyy h:mm a")})</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Price per Unit</div>
                  <div className="text-lg font-bold text-foreground">₹{myQuote.pricePerUnit.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Price</div>
                  <div className="text-lg font-bold text-foreground">₹{myQuote.totalPrice.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Delivery</div>
                  <div className="font-medium text-foreground">{myQuote.deliveryDays} days</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Validity</div>
                  <div className="font-medium text-foreground">{myQuote.validityDays} days</div>
                </div>
              </div>
              {myQuote.notes && (
                <div className="mt-4">
                  <div className="text-sm text-muted-foreground">Notes</div>
                  <div className="text-foreground">{myQuote.notes}</div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quote Update Toggle */}
        {hasQuoted && !isAwarded && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-foreground">Allow Quote Updates</div>
                  <div className="text-sm text-muted-foreground">Enable to revise your quote before the RFQ closes</div>
                </div>
                <Switch checked={allowUpdate} onCheckedChange={setAllowUpdate} />
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
