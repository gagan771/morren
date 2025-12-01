"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getRFQs, type RFQ, getLowestQuote } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Eye, FileText, Clock, CheckCircle2, Award } from "lucide-react"
import { format } from "date-fns"

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }
> = {
  DRAFT: { label: "Draft", variant: "secondary", icon: FileText },
  OPEN: { label: "Open", variant: "default", icon: Clock },
  CLOSED: { label: "Closed", variant: "outline", icon: CheckCircle2 },
  AWARDED: { label: "Awarded", variant: "default", icon: Award },
}

export default function DashboardPage() {
  const [rfqs, setRfqs] = useState<RFQ[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setRfqs(getRFQs())
    setLoading(false)
  }, [])

  const stats = {
    total: rfqs.length,
    open: rfqs.filter((r) => r.status === "OPEN").length,
    awarded: rfqs.filter((r) => r.status === "AWARDED").length,
    totalQuotes: rfqs.reduce((sum, r) => sum + r.quotes.length, 0),
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">RFQ Management</h1>
          <p className="text-muted-foreground mt-1">Manage your Request for Quotes</p>
        </div>
        <Link href="/dashboard/rfq/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create New RFQ
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total RFQs</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.open}</div>
                <div className="text-sm text-muted-foreground">Open RFQs</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Award className="h-5 w-5 text-warning" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.awarded}</div>
                <div className="text-sm text-muted-foreground">Awarded</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.totalQuotes}</div>
                <div className="text-sm text-muted-foreground">Total Quotes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RFQ List */}
      <Card>
        <CardHeader>
          <CardTitle>All RFQs</CardTitle>
        </CardHeader>
        <CardContent>
          {rfqs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No RFQs yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first RFQ to start receiving quotes from suppliers.
              </p>
              <Link href="/dashboard/rfq/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New RFQ
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Required By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Quotes</TableHead>
                    <TableHead>Lowest Bid</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rfqs.map((rfq) => {
                    const status = statusConfig[rfq.status]
                    const lowestQuote = getLowestQuote(rfq.quotes)
                    return (
                      <TableRow key={rfq.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-foreground">{rfq.productName}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-[200px]">{rfq.specs}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {rfq.quantity} {rfq.unit}
                        </TableCell>
                        <TableCell>{format(new Date(rfq.requiredByDate), "MMM dd, yyyy")}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="gap-1">
                            <status.icon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-foreground font-medium">{rfq.quotes.length}</span>
                          <span className="text-muted-foreground"> / {rfq.invites.length}</span>
                        </TableCell>
                        <TableCell>
                          {lowestQuote ? (
                            <span className="font-medium text-success">
                              ₹{lowestQuote.pricePerUnit.toLocaleString()}/unit
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/dashboard/rfq/${rfq.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
