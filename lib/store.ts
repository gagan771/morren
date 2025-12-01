import type { RFQ, Supplier, Quote, MarketPrice, BuyerProfile, SupplierInvite } from "./types"

const STORAGE_KEYS = {
  RFQS: "rfq_management_rfqs",
  SUPPLIERS: "rfq_management_suppliers",
  MARKET_PRICES: "rfq_management_market_prices",
  BUYER_PROFILE: "rfq_management_buyer_profile",
}

// Default suppliers list
const DEFAULT_SUPPLIERS: Supplier[] = [
  {
    id: "s1",
    name: "ABC Trading Co.",
    email: "sales@abctrading.com",
    phone: "+91 9876543210",
    contactPerson: "Rajesh Kumar",
  },
  {
    id: "s2",
    name: "Global Supplies Ltd.",
    email: "info@globalsupplies.com",
    phone: "+91 9876543211",
    contactPerson: "Priya Sharma",
  },
  {
    id: "s3",
    name: "Premier Materials",
    email: "orders@premiermaterials.com",
    phone: "+91 9876543212",
    contactPerson: "Amit Patel",
  },
  {
    id: "s4",
    name: "Quality First Inc.",
    email: "quotes@qualityfirst.com",
    phone: "+91 9876543213",
    contactPerson: "Sneha Gupta",
  },
  {
    id: "s5",
    name: "Supreme Traders",
    email: "sales@supremetraders.com",
    phone: "+91 9876543214",
    contactPerson: "Vikram Singh",
  },
  {
    id: "s6",
    name: "Metro Wholesale",
    email: "contact@metrowholesale.com",
    phone: "+91 9876543215",
    contactPerson: "Anita Desai",
  },
  {
    id: "s7",
    name: "Eastern Exports",
    email: "exports@easternexports.com",
    phone: "+91 9876543216",
    contactPerson: "Suresh Menon",
  },
]

const DEFAULT_BUYER_PROFILE: BuyerProfile = {
  companyName: "Morera Ventures LLP",
  buyerName: "Admin",
  email: "admin@moreraventures.com",
}

// Helper to safely parse JSON from localStorage
function safeJsonParse<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue
  try {
    const item = localStorage.getItem(key)
    if (!item) return defaultValue
    return JSON.parse(item, (key, value) => {
      if (key.includes("Date") || key.includes("At") || key === "date") {
        return value ? new Date(value) : value
      }
      return value
    })
  } catch {
    return defaultValue
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify(data))
}

// RFQ Operations
export function getRFQs(): RFQ[] {
  return safeJsonParse<RFQ[]>(STORAGE_KEYS.RFQS, [])
}

export function getRFQById(id: string): RFQ | undefined {
  const rfqs = getRFQs()
  return rfqs.find((r) => r.id === id)
}

export function getRFQByInviteToken(token: string): { rfq: RFQ; invite: SupplierInvite; supplier: Supplier } | null {
  const rfqs = getRFQs()
  const suppliers = getSuppliers()

  for (const rfq of rfqs) {
    const invite = rfq.invites.find((i) => i.inviteToken === token)
    if (invite) {
      const supplier = suppliers.find((s) => s.id === invite.supplierId)
      if (supplier) {
        return { rfq, invite, supplier }
      }
    }
  }
  return null
}

export function createRFQ(rfq: Omit<RFQ, "id" | "createdAt" | "invites" | "quotes" | "status">): RFQ {
  const rfqs = getRFQs()
  const newRFQ: RFQ = {
    ...rfq,
    id: `rfq_${Date.now()}`,
    status: "DRAFT",
    createdAt: new Date(),
    invites: [],
    quotes: [],
  }
  rfqs.push(newRFQ)
  saveToStorage(STORAGE_KEYS.RFQS, rfqs)
  return newRFQ
}

export function updateRFQ(id: string, updates: Partial<RFQ>): RFQ | null {
  const rfqs = getRFQs()
  const index = rfqs.findIndex((r) => r.id === id)
  if (index === -1) return null

  rfqs[index] = { ...rfqs[index], ...updates }
  saveToStorage(STORAGE_KEYS.RFQS, rfqs)
  return rfqs[index]
}

export function addInviteToRFQ(rfqId: string, supplierId: string): SupplierInvite | null {
  const rfqs = getRFQs()
  const index = rfqs.findIndex((r) => r.id === rfqId)
  if (index === -1) return null

  const invite: SupplierInvite = {
    id: `inv_${Date.now()}_${supplierId}`,
    rfqId,
    supplierId,
    status: "INVITE_SENT",
    inviteToken: `${rfqId}_${supplierId}_${Math.random().toString(36).substring(2, 15)}`,
    sentAt: new Date(),
  }

  rfqs[index].invites.push(invite)
  if (rfqs[index].status === "DRAFT") {
    rfqs[index].status = "OPEN"
  }
  saveToStorage(STORAGE_KEYS.RFQS, rfqs)
  return invite
}

export function markInviteViewed(token: string): void {
  const rfqs = getRFQs()
  for (const rfq of rfqs) {
    const invite = rfq.invites.find((i) => i.inviteToken === token)
    if (invite && invite.status === "INVITE_SENT") {
      invite.status = "VIEWED"
      invite.viewedAt = new Date()
      break
    }
  }
  saveToStorage(STORAGE_KEYS.RFQS, rfqs)
}

export function submitQuote(
  rfqId: string,
  supplierId: string,
  supplierName: string,
  quoteData: { pricePerUnit: number; totalPrice: number; deliveryDays: number; validityDays: number; notes?: string },
): Quote | null {
  const rfqs = getRFQs()
  const rfqIndex = rfqs.findIndex((r) => r.id === rfqId)
  if (rfqIndex === -1) return null

  const rfq = rfqs[rfqIndex]
  const existingQuoteIndex = rfq.quotes.findIndex((q) => q.supplierId === supplierId)

  const quote: Quote = {
    id: existingQuoteIndex >= 0 ? rfq.quotes[existingQuoteIndex].id : `quote_${Date.now()}`,
    rfqId,
    supplierId,
    supplierName,
    ...quoteData,
    submittedAt: existingQuoteIndex >= 0 ? rfq.quotes[existingQuoteIndex].submittedAt : new Date(),
    updatedAt: existingQuoteIndex >= 0 ? new Date() : undefined,
  }

  if (existingQuoteIndex >= 0) {
    rfq.quotes[existingQuoteIndex] = quote
  } else {
    rfq.quotes.push(quote)
  }

  // Update invite status
  const invite = rfq.invites.find((i) => i.supplierId === supplierId)
  if (invite) {
    invite.status = existingQuoteIndex >= 0 ? "UPDATED" : "QUOTED"
    invite.quotedAt = new Date()
  }

  saveToStorage(STORAGE_KEYS.RFQS, rfqs)
  return quote
}

export function awardRFQ(rfqId: string, supplierId: string, supplierName: string, price: number): RFQ | null {
  const rfqs = getRFQs()
  const index = rfqs.findIndex((r) => r.id === rfqId)
  if (index === -1) return null

  rfqs[index].status = "AWARDED"
  rfqs[index].awardedTo = {
    supplierId,
    supplierName,
    price,
    awardedAt: new Date(),
  }

  saveToStorage(STORAGE_KEYS.RFQS, rfqs)
  return rfqs[index]
}

// Supplier Operations
export function getSuppliers(): Supplier[] {
  const stored = safeJsonParse<Supplier[]>(STORAGE_KEYS.SUPPLIERS, [])
  if (stored.length === 0) {
    saveToStorage(STORAGE_KEYS.SUPPLIERS, DEFAULT_SUPPLIERS)
    return DEFAULT_SUPPLIERS
  }
  return stored
}

export function getSupplierById(id: string): Supplier | undefined {
  return getSuppliers().find((s) => s.id === id)
}

// Market Price Operations
export function getMarketPrices(productName?: string): MarketPrice[] {
  const prices = safeJsonParse<MarketPrice[]>(STORAGE_KEYS.MARKET_PRICES, [])
  if (productName) {
    return prices.filter((p) => p.productName.toLowerCase() === productName.toLowerCase())
  }
  return prices
}

export function addMarketPrice(productName: string, price: number): MarketPrice {
  const prices = getMarketPrices()
  const newPrice: MarketPrice = {
    id: `mp_${Date.now()}`,
    productName,
    price,
    date: new Date(),
  }
  prices.push(newPrice)
  saveToStorage(STORAGE_KEYS.MARKET_PRICES, prices)
  return newPrice
}

// Buyer Profile Operations
export function getBuyerProfile(): BuyerProfile {
  return safeJsonParse<BuyerProfile>(STORAGE_KEYS.BUYER_PROFILE, DEFAULT_BUYER_PROFILE)
}

export function updateBuyerProfile(profile: BuyerProfile): void {
  saveToStorage(STORAGE_KEYS.BUYER_PROFILE, profile)
}

// Utility functions
export function generateInviteUrl(token: string): string {
  if (typeof window === "undefined") return ""
  return `${window.location.origin}/supplier/${token}`
}

export function getLowestQuote(quotes: Quote[]): Quote | null {
  if (quotes.length === 0) return null
  return quotes.reduce((lowest, quote) => (quote.pricePerUnit < lowest.pricePerUnit ? quote : lowest))
}

export function calculatePercentageDiff(price: number, lowestPrice: number): number {
  if (lowestPrice === 0) return 0
  return ((price - lowestPrice) / lowestPrice) * 100
}
