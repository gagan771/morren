"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createRFQ } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

const units = ["kg", "pcs", "mt", "liters", "tons", "units", "boxes", "bags"]

export default function CreateRFQPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    productName: "",
    specs: "",
    quantity: "",
    unit: "kg",
    requiredByDate: "",
    notes: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const rfq = createRFQ({
        productName: formData.productName,
        specs: formData.specs,
        quantity: Number.parseFloat(formData.quantity),
        unit: formData.unit,
        requiredByDate: new Date(formData.requiredByDate),
        notes: formData.notes || undefined,
      })
      router.push(`/dashboard/rfq/${rfq.id}`)
    } catch (error) {
      console.error("Error creating RFQ:", error)
      setLoading(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to RFQs
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Create New RFQ</h1>
        <p className="text-muted-foreground mt-1">Fill in the details for your Request for Quote</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>RFQ Details</CardTitle>
          <CardDescription>Provide product information and requirements</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="productName">Product Name *</Label>
              <Input
                id="productName"
                value={formData.productName}
                onChange={(e) => setFormData((prev) => ({ ...prev, productName: e.target.value }))}
                placeholder="e.g., Wheat, Steel Bars, Cotton"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specs">Specifications / Description *</Label>
              <Textarea
                id="specs"
                value={formData.specs}
                onChange={(e) => setFormData((prev) => ({ ...prev, specs: e.target.value }))}
                placeholder="Enter detailed product specifications, quality requirements, standards, etc."
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                  placeholder="e.g., 1000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, unit: value }))}
                >
                  <SelectTrigger id="unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requiredByDate">Required By Date *</Label>
              <Input
                id="requiredByDate"
                type="date"
                value={formData.requiredByDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, requiredByDate: e.target.value }))}
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional information for suppliers..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Link href="/dashboard" className="flex-1">
                <Button type="button" variant="outline" className="w-full bg-transparent">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" className="flex-1" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Creating..." : "Create RFQ"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
