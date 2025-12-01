"use client"

import { useState, useEffect } from "react"
import { getBuyerProfile, updateBuyerProfile, type BuyerProfile } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Building2, User, Save, LogOut } from "lucide-react"

export default function SettingsPage() {
  const { toast } = useToast()
  const [profile, setProfile] = useState<BuyerProfile>({
    companyName: "",
    buyerName: "",
    email: "",
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const storedProfile = getBuyerProfile()
    setProfile(storedProfile)
  }, [])

  const handleSave = () => {
    setLoading(true)
    try {
      updateBuyerProfile(profile)
      toast({
        title: "Settings Saved",
        description: "Your profile has been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const handleLogout = () => {
    // Clear all local storage
    if (typeof window !== "undefined") {
      localStorage.clear()
      window.location.href = "/"
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      <Toaster />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile and preferences</p>
      </div>

      {/* Company Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Profile
          </CardTitle>
          <CardDescription>Your company information visible to suppliers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={profile.companyName}
              onChange={(e) => setProfile((prev) => ({ ...prev, companyName: e.target.value }))}
              placeholder="e.g., Morera Ventures LLP"
            />
          </div>
        </CardContent>
      </Card>

      {/* Buyer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Buyer Information
          </CardTitle>
          <CardDescription>Your personal contact details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="buyerName">Name</Label>
            <Input
              id="buyerName"
              value={profile.buyerName}
              onChange={(e) => setProfile((prev) => ({ ...prev, buyerName: e.target.value }))}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="your@email.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleSave} disabled={loading} className="flex-1">
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Saving..." : "Save Changes"}
        </Button>
        <Button variant="destructive" onClick={handleLogout} className="flex-1">
          <LogOut className="h-4 w-4 mr-2" />
          Logout & Clear Data
        </Button>
      </div>

      {/* Info */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> This application stores data locally in your browser. Logging out will clear all your
            RFQs, quotes, and settings.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
