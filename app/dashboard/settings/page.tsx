"use client"

import { useState, useEffect } from "react"
import { getBuyerProfile, updateBuyerProfile, type BuyerProfile } from "@/lib/supabase-api"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Building2, User, Save, LogOut } from "lucide-react"

export default function SettingsPage() {
  const { toast } = useToast()
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<BuyerProfile>({
    companyName: "",
    buyerName: "",
    email: "",
  })
  const [loading, setLoading] = useState(false)

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
      fetchProfile()
    }
  }, [user, authLoading, router])

  const fetchProfile = async () => {
    if (!user) return
    try {
      const profileData = await getBuyerProfile(user.id)
      if (profileData) {
        setProfile(profileData)
      } else {
        // Set default from user data
        setProfile({
          companyName: "Morera Ventures LLP",
          buyerName: user.name,
          email: user.email,
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      // Set default from user data
      if (user) {
        setProfile({
          companyName: "Morera Ventures LLP",
          buyerName: user.name,
          email: user.email,
        })
      }
    }
  }

  const handleSave = async () => {
    if (!user) return
    setLoading(true)
    try {
      await updateBuyerProfile(user.id, profile)
      toast({
        title: "Settings Saved",
        description: "Your profile has been updated successfully.",
      })
    } catch (error) {
      console.error('Error saving profile:', error)
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  if (authLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
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
              onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
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
              onChange={(e) => setProfile({ ...profile, buyerName: e.target.value })}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
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
          Logout
        </Button>
      </div>
    </div>
  )
}
