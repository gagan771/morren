
'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ShoppingCart, Package, DollarSign, TrendingUp, TrendingDown, Eye, Plus, Check, X, Clock, Search, Leaf, Wheat, Apple, Nut, List, Trash2, Send, MoreHorizontal, Copy, Edit, Filter, SortAsc, SortDesc, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { Item, Order, Bid, ShippingBid } from '@/lib/types';
import { DashboardLayout } from '@/components/dashboard-layout';
import { CardContainer, CardBody, CardItem } from '@/components/ui/aceternity/3d-card';
import { BackgroundBeams } from '@/components/ui/aceternity/background-beams';
import { ClockTimer } from '@/components/ui/clock-timer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getActiveItems, getOrdersByBuyer, getBidsByOrder, createOrder, getBuyerStats, updateBid, updateOrder, createItem, deleteBid, getShippingBidsByOrder, updateShippingBid } from '@/lib/supabase-api';
import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LocalCache, CacheKeys, CacheDuration } from '@/lib/cache';
import { processAutoAccepts } from '@/lib/auto-accept';

// Predefined Product Catalog with Varieties
const PRODUCT_CATALOG = {
    spices: [
        // Cumin varieties
        { name: "Cumin (Jeera) - Singapore Quality", hsn: "0909", variety: "Singapore Quality" },
        { name: "Cumin (Jeera) - Europe Quality", hsn: "0909", variety: "Europe Quality" },
        { name: "Cumin (Jeera) - Regular", hsn: "0909", variety: "Regular" },
        { name: "Cumin (Jeera) - Bold", hsn: "0909", variety: "Bold" },

        // Coriander varieties
        { name: "Coriander Seeds - Eagle Quality", hsn: "0909", variety: "Eagle Quality" },
        { name: "Coriander Seeds - Scooter Quality", hsn: "0909", variety: "Scooter Quality" },
        { name: "Coriander Seeds - Regular", hsn: "0909", variety: "Regular" },

        // Mustard varieties
        { name: "Mustard Seeds - Yellow", hsn: "1207", variety: "Yellow" },
        { name: "Mustard Seeds - Black", hsn: "1207", variety: "Black" },
        { name: "Mustard Seeds - Brown", hsn: "1207", variety: "Brown" },

        // Fennel varieties
        { name: "Fennel Seeds (Saunf) - Lucknowi", hsn: "0909", variety: "Lucknowi" },
        { name: "Fennel Seeds (Saunf) - Bold", hsn: "0909", variety: "Bold" },
        { name: "Fennel Seeds (Saunf) - Regular", hsn: "0909", variety: "Regular" },

        { name: "Fenugreek Seeds (Methi)", hsn: "0910", variety: "Standard" },
        { name: "Carom Seeds (Ajwain) - Bold", hsn: "0910", variety: "Bold" },
        { name: "Carom Seeds (Ajwain) - Regular", hsn: "0910", variety: "Regular" },
        { name: "Nigella Seeds (Kalonji)", hsn: "0910", variety: "Standard" },

        // Black Pepper varieties
        { name: "Black Pepper - 500 GL", hsn: "0904", variety: "500 GL" },
        { name: "Black Pepper - 550 GL", hsn: "0904", variety: "550 GL" },
        { name: "Black Pepper - 580 GL", hsn: "0904", variety: "580 GL" },
        { name: "Black Pepper - MG1", hsn: "0904", variety: "MG1 (Malabar Garbled)" },
        { name: "Black Pepper - TGSEB", hsn: "0904", variety: "TGSEB" },

        // Cloves varieties
        { name: "Cloves - Hand Picked", hsn: "0907", variety: "Hand Picked" },
        { name: "Cloves - Machine Cleaned", hsn: "0907", variety: "Machine Cleaned" },
        { name: "Cloves - FAQ", hsn: "0907", variety: "FAQ" },

        // Cinnamon varieties
        { name: "Cinnamon - Split", hsn: "0906", variety: "Split" },
        { name: "Cinnamon - Quillings", hsn: "0906", variety: "Quillings" },
        { name: "Cinnamon - Stick", hsn: "0906", variety: "Stick" },
        { name: "Cinnamon - Powder", hsn: "0906", variety: "Powder" },

        // Cardamom Green varieties
        { name: "Cardamom Green - 5-6mm", hsn: "0908", variety: "5-6mm" },
        { name: "Cardamom Green - 6-7mm", hsn: "0908", variety: "6-7mm" },
        { name: "Cardamom Green - 7-8mm", hsn: "0908", variety: "7-8mm" },
        { name: "Cardamom Green - 8mm+", hsn: "0908", variety: "8mm+ (Bold)" },
        { name: "Cardamom Green - AGB", hsn: "0908", variety: "AGB (Alleppey Green Bold)" },
        { name: "Cardamom Green - AGS", hsn: "0908", variety: "AGS (Alleppey Green Superior)" },

        // Cardamom Black varieties
        { name: "Cardamom Black - Large", hsn: "0908", variety: "Large" },
        { name: "Cardamom Black - Medium", hsn: "0908", variety: "Medium" },
        { name: "Cardamom Black - Small", hsn: "0908", variety: "Small" },

        { name: "Bay Leaf (Tej Patta) - Whole", hsn: "0910", variety: "Whole" },
        { name: "Bay Leaf (Tej Patta) - Broken", hsn: "0910", variety: "Broken" },

        { name: "Star Anise - Whole", hsn: "0910", variety: "Whole" },
        { name: "Star Anise - Broken", hsn: "0910", variety: "Broken" },

        { name: "Mace (Javitri) - Whole", hsn: "0908", variety: "Whole" },
        { name: "Mace (Javitri) - Broken", hsn: "0908", variety: "Broken" },

        // Nutmeg varieties
        { name: "Nutmeg (Jaiphal) - With Shell", hsn: "0908", variety: "With Shell" },
        { name: "Nutmeg (Jaiphal) - Without Shell", hsn: "0908", variety: "Without Shell" },
        { name: "Nutmeg (Jaiphal) - Powder", hsn: "0908", variety: "Powder" },

        // Turmeric varieties
        { name: "Turmeric Whole - Finger", hsn: "0910", variety: "Finger" },
        { name: "Turmeric Whole - Bulb", hsn: "0910", variety: "Bulb" },
        { name: "Turmeric Whole - Polished", hsn: "0910", variety: "Polished" },
        { name: "Turmeric Whole - Unpolished", hsn: "0910", variety: "Unpolished" },

        // Red Chilli varieties
        { name: "Red Chilli Whole - Guntur Sannam S4", hsn: "0904", variety: "Guntur Sannam S4" },
        { name: "Red Chilli Whole - Guntur Teja S17", hsn: "0904", variety: "Guntur Teja S17" },
        { name: "Red Chilli Whole - Byadgi", hsn: "0904", variety: "Byadgi" },
        { name: "Red Chilli Whole - Kashmiri", hsn: "0904", variety: "Kashmiri" },
        { name: "Red Chilli Whole - Wrinkled", hsn: "0904", variety: "Wrinkled" },
        { name: "Red Chilli Whole - Stemless", hsn: "0904", variety: "Stemless" },

        { name: "Dry Ginger - Cochin", hsn: "0910", variety: "Cochin" },
        { name: "Dry Ginger - Calicut", hsn: "0910", variety: "Calicut" },
        { name: "Dry Ginger - Bleached", hsn: "0910", variety: "Bleached" },
        { name: "Dry Ginger - Unbleached", hsn: "0910", variety: "Unbleached" },

        // Powder varieties
        { name: "Turmeric Powder - 2% Curcumin", hsn: "0910", variety: "2% Curcumin" },
        { name: "Turmeric Powder - 3% Curcumin", hsn: "0910", variety: "3% Curcumin" },
        { name: "Turmeric Powder - 5% Curcumin", hsn: "0910", variety: "5% Curcumin" },

        { name: "Red Chilli Powder - Hot", hsn: "0904", variety: "Hot" },
        { name: "Red Chilli Powder - Medium", hsn: "0904", variety: "Medium" },
        { name: "Red Chilli Powder - Mild", hsn: "0904", variety: "Mild" },
        { name: "Red Chilli Powder - Kashmiri", hsn: "0904", variety: "Kashmiri (Color)" },

        { name: "Coriander Powder - Regular", hsn: "0909", variety: "Regular" },
        { name: "Cumin Powder - Regular", hsn: "0909", variety: "Regular" },
        { name: "Black Pepper Powder - Regular", hsn: "0904", variety: "Regular" },
        { name: "Garam Masala - Standard", hsn: "0910", variety: "Standard" },
        { name: "Garam Masala - Premium", hsn: "0910", variety: "Premium" },
        { name: "Chicken Masala", hsn: "0910", variety: "Standard" },
        { name: "Meat Masala", hsn: "0910", variety: "Standard" }
    ],
    vegetables: [
        // Potato varieties
        { name: "Potato - 3797", hsn: "0701", variety: "3797" },
        { name: "Potato - Jyoti", hsn: "0701", variety: "Jyoti" },
        { name: "Potato - Pukhraj", hsn: "0701", variety: "Pukhraj" },
        { name: "Potato - Chipsona", hsn: "0701", variety: "Chipsona" },
        { name: "Potato - Kufri", hsn: "0701", variety: "Kufri" },
        { name: "Potato - Red", hsn: "0701", variety: "Red" },

        // Onion varieties
        { name: "Onion - Red (Nashik)", hsn: "0703", variety: "Red Nashik" },
        { name: "Onion - Red (Bangalore)", hsn: "0703", variety: "Red Bangalore" },
        { name: "Onion - White", hsn: "0703", variety: "White" },
        { name: "Onion - Pink", hsn: "0703", variety: "Pink" },
        { name: "Onion - Shallot (Sambar)", hsn: "0703", variety: "Shallot/Sambar" },
        { name: "Onion - 45-55mm", hsn: "0703", variety: "45-55mm" },
        { name: "Onion - 55-65mm", hsn: "0703", variety: "55-65mm" },
        { name: "Onion - 65-75mm", hsn: "0703", variety: "65-75mm" },

        // Tomato varieties
        { name: "Tomato - Hybrid", hsn: "0702", variety: "Hybrid" },
        { name: "Tomato - Desi", hsn: "0702", variety: "Desi" },
        { name: "Tomato - Cherry", hsn: "0702", variety: "Cherry" },
        { name: "Tomato - Roma", hsn: "0702", variety: "Roma" },

        // Green Chilli varieties
        { name: "Green Chilli - Finger Hot", hsn: "0709", variety: "Finger Hot" },
        { name: "Green Chilli - Jwala", hsn: "0709", variety: "Jwala" },
        { name: "Green Chilli - Bhavnagri", hsn: "0709", variety: "Bhavnagri" },
        { name: "Green Chilli - Bird Eye", hsn: "0709", variety: "Bird Eye" },

        // Ginger varieties
        { name: "Ginger - Maran", hsn: "0910", variety: "Maran" },
        { name: "Ginger - Nadia", hsn: "0910", variety: "Nadia" },
        { name: "Ginger - Dry (Saunth)", hsn: "0910", variety: "Dry/Saunth" },

        // Garlic varieties
        { name: "Garlic - Single Clove", hsn: "0703", variety: "Single Clove" },
        { name: "Garlic - Multi Clove", hsn: "0703", variety: "Multi Clove" },
        { name: "Garlic - 25-30mm", hsn: "0703", variety: "25-30mm" },
        { name: "Garlic - 30-35mm", hsn: "0703", variety: "30-35mm" },
        { name: "Garlic - 35-40mm", hsn: "0703", variety: "35-40mm" },
        { name: "Garlic - 40mm+", hsn: "0703", variety: "40mm+" },

        { name: "Carrot - Orange", hsn: "0706", variety: "Orange" },
        { name: "Carrot - Red", hsn: "0706", variety: "Red" },
        { name: "Beans - French", hsn: "0708", variety: "French" },
        { name: "Beans - Flat", hsn: "0708", variety: "Flat" },
        { name: "Cauliflower - White", hsn: "0704", variety: "White" },
        { name: "Cabbage - Green", hsn: "0704", variety: "Green" },
        { name: "Cabbage - Red", hsn: "0704", variety: "Red" },
        { name: "Spinach - Palak", hsn: "0709", variety: "Palak" },
        { name: "Broccoli - Green", hsn: "0704", variety: "Green" },
        { name: "Capsicum - Green", hsn: "0709", variety: "Green" },
        { name: "Capsicum - Red", hsn: "0709", variety: "Red" },
        { name: "Capsicum - Yellow", hsn: "0709", variety: "Yellow" },
        { name: "Green Peas - Fresh", hsn: "0710", variety: "Fresh" },
        { name: "Green Peas - Frozen", hsn: "0710", variety: "Frozen" },
        { name: "Sweet Corn - Fresh", hsn: "0710", variety: "Fresh" },
        { name: "Sweet Corn - Frozen", hsn: "0710", variety: "Frozen" },
        { name: "Brinjal (Eggplant) - Long", hsn: "0709", variety: "Long" },
        { name: "Brinjal (Eggplant) - Round", hsn: "0709", variety: "Round" },
        { name: "Lady Finger (Okra)", hsn: "0709", variety: "Standard" },
        { name: "Bottle Gourd", hsn: "0709", variety: "Standard" },
        { name: "Pumpkin - Orange", hsn: "0709", variety: "Orange" },
        { name: "Pumpkin - Green", hsn: "0709", variety: "Green" },
        { name: "Beetroot", hsn: "0706", variety: "Standard" },
        { name: "Radish - White", hsn: "0706", variety: "White" },
        { name: "Radish - Red", hsn: "0706", variety: "Red" },
        { name: "Cucumber - English", hsn: "0707", variety: "English" },
        { name: "Cucumber - Desi", hsn: "0707", variety: "Desi" },
        { name: "Lettuce - Iceberg", hsn: "0705", variety: "Iceberg" },
        { name: "Lettuce - Romaine", hsn: "0705", variety: "Romaine" },
        { name: "Lemon - Kagzi", hsn: "0805", variety: "Kagzi" },
        { name: "Lemon - Seedless", hsn: "0805", variety: "Seedless" }
    ],
    pulses: [
        // Toor Dal varieties
        { name: "Toor Dal - Polished", hsn: "0713", variety: "Polished" },
        { name: "Toor Dal - Unpolished", hsn: "0713", variety: "Unpolished" },
        { name: "Toor Dal - Oily", hsn: "0713", variety: "Oily" },
        { name: "Toor Dal - Tatapuri", hsn: "0713", variety: "Tatapuri" },

        // Chana Dal varieties
        { name: "Chana Dal - Bold", hsn: "0713", variety: "Bold" },
        { name: "Chana Dal - Medium", hsn: "0713", variety: "Medium" },
        { name: "Chana Dal - Small", hsn: "0713", variety: "Small" },

        // Moong Dal varieties
        { name: "Moong Dal - Yellow Split", hsn: "0713", variety: "Yellow Split" },
        { name: "Moong Dal - Green Whole", hsn: "0713", variety: "Green Whole" },
        { name: "Moong Dal - Washed", hsn: "0713", variety: "Washed" },
        { name: "Moong Dal - Chilka", hsn: "0713", variety: "Chilka (Split with Skin)" },

        // Urad Dal varieties
        { name: "Urad Dal - Black Whole", hsn: "0713", variety: "Black Whole" },
        { name: "Urad Dal - White Split", hsn: "0713", variety: "White Split" },
        { name: "Urad Dal - Chilka", hsn: "0713", variety: "Chilka (Split with Skin)" },

        // Masoor Dal varieties
        { name: "Masoor Dal - Red Whole", hsn: "0713", variety: "Red Whole" },
        { name: "Masoor Dal - Red Split", hsn: "0713", variety: "Red Split" },
        { name: "Masoor Dal - Brown", hsn: "0713", variety: "Brown" },

        // Rajma varieties
        { name: "Rajma - Chitra", hsn: "0713", variety: "Chitra" },
        { name: "Rajma - Kashmiri", hsn: "0713", variety: "Kashmiri (Red)" },
        { name: "Rajma - Jammu", hsn: "0713", variety: "Jammu" },
        { name: "Rajma - Red", hsn: "0713", variety: "Red" },
        { name: "Rajma - White", hsn: "0713", variety: "White" },

        // Kabuli Chana varieties
        { name: "Kabuli Chana - 8mm", hsn: "0713", variety: "8mm" },
        { name: "Kabuli Chana - 9mm", hsn: "0713", variety: "9mm" },
        { name: "Kabuli Chana - 10mm", hsn: "0713", variety: "10mm" },
        { name: "Kabuli Chana - 11mm", hsn: "0713", variety: "11mm" },
        { name: "Kabuli Chana - 12mm+", hsn: "0713", variety: "12mm+ (Jumbo)" },

        { name: "Black Chana - Desi", hsn: "0713", variety: "Desi" },
        { name: "Black Chana - Kala Chana", hsn: "0713", variety: "Kala Chana" },

        { name: "Green Moong - Whole", hsn: "0713", variety: "Whole" },
        { name: "Green Moong - Split", hsn: "0713", variety: "Split" },

        { name: "Lobia (Black Eyed Beans)", hsn: "0713", variety: "Standard" },
        { name: "Horse Gram", hsn: "0713", variety: "Standard" },

        // Yellow Peas varieties
        { name: "Yellow Peas - Whole", hsn: "0713", variety: "Whole" },
        { name: "Yellow Peas - Split", hsn: "0713", variety: "Split" }
    ],
    dry_fruits_and_nuts: [
        // Almonds varieties
        { name: "Almonds - California", hsn: "0802", variety: "California" },
        { name: "Almonds - Mamra (Gurbandi)", hsn: "0802", variety: "Mamra/Gurbandi" },
        { name: "Almonds - Sanora", hsn: "0802", variety: "Sanora" },
        { name: "Almonds - NP (Non Pareil)", hsn: "0802", variety: "NP (Non Pareil)" },
        { name: "Almonds - 20/22", hsn: "0802", variety: "20/22 Count" },
        { name: "Almonds - 23/25", hsn: "0802", variety: "23/25 Count" },
        { name: "Almonds - 27/30", hsn: "0802", variety: "27/30 Count" },
        { name: "Almonds - Sliced", hsn: "0802", variety: "Sliced" },
        { name: "Almonds - Blanched", hsn: "0802", variety: "Blanched" },

        // Cashews varieties
        { name: "Cashews - W180", hsn: "0801", variety: "W180 (King Size)" },
        { name: "Cashews - W210", hsn: "0801", variety: "W210" },
        { name: "Cashews - W240", hsn: "0801", variety: "W240" },
        { name: "Cashews - W320", hsn: "0801", variety: "W320" },
        { name: "Cashews - W450", hsn: "0801", variety: "W450" },
        { name: "Cashews - WS (Scorched Wholes)", hsn: "0801", variety: "WS (Scorched)" },
        { name: "Cashews - SW (Split Wholes)", hsn: "0801", variety: "SW (Split)" },
        { name: "Cashews - LWP (Large White Pieces)", hsn: "0801", variety: "LWP" },
        { name: "Cashews - SWP (Small White Pieces)", hsn: "0801", variety: "SWP" },
        { name: "Cashews - BB (Butts)", hsn: "0801", variety: "BB (Butts)" },

        // Pistachios varieties
        { name: "Pistachios - Iranian", hsn: "0802", variety: "Iranian" },
        { name: "Pistachios - American", hsn: "0802", variety: "American" },
        { name: "Pistachios - Roasted Salted", hsn: "0802", variety: "Roasted Salted" },
        { name: "Pistachios - Raw", hsn: "0802", variety: "Raw" },
        { name: "Pistachios - 21/25", hsn: "0802", variety: "21/25 Count" },
        { name: "Pistachios - 26/30", hsn: "0802", variety: "26/30 Count" },

        // Walnuts varieties
        { name: "Walnuts - Chile", hsn: "0802", variety: "Chile" },
        { name: "Walnuts - Kashmir", hsn: "0802", variety: "Kashmir" },
        { name: "Walnuts - California", hsn: "0802", variety: "California" },
        { name: "Walnuts - In Shell", hsn: "0802", variety: "In Shell" },
        { name: "Walnuts - Kernels Light Halves", hsn: "0802", variety: "Kernels LH" },
        { name: "Walnuts - Kernels Light Pieces", hsn: "0802", variety: "Kernels LP" },

        // Raisins varieties
        { name: "Raisins - Green (Kishmish)", hsn: "0806", variety: "Green Kishmish" },
        { name: "Raisins - Golden", hsn: "0806", variety: "Golden" },
        { name: "Raisins - Black (Kali Draksh)", hsn: "0806", variety: "Black" },
        { name: "Raisins - Sultana", hsn: "0806", variety: "Sultana" },
        { name: "Raisins - Munakka", hsn: "0806", variety: "Munakka" },
        { name: "Raisins - Afghan", hsn: "0806", variety: "Afghan" },
        { name: "Raisins - Indian", hsn: "0806", variety: "Indian" },

        // Fig varieties
        { name: "Fig (Anjeer) - Dried", hsn: "0804", variety: "Dried" },
        { name: "Fig (Anjeer) - Turkish", hsn: "0804", variety: "Turkish" },
        { name: "Fig (Anjeer) - Afghan", hsn: "0804", variety: "Afghan" },

        // Dates varieties
        { name: "Dates - Medjool", hsn: "0804", variety: "Medjool" },
        { name: "Dates - Ajwa", hsn: "0804", variety: "Ajwa" },
        { name: "Dates - Kimia", hsn: "0804", variety: "Kimia" },
        { name: "Dates - Safawi", hsn: "0804", variety: "Safawi" },
        { name: "Dates - Mabroom", hsn: "0804", variety: "Mabroom" },
        { name: "Dates - Deglet Noor", hsn: "0804", variety: "Deglet Noor" },
        { name: "Dates - Khudri", hsn: "0804", variety: "Khudri" },

        // Apricot varieties
        { name: "Apricot - Turkish", hsn: "0813", variety: "Turkish" },
        { name: "Apricot - Ladakhi", hsn: "0813", variety: "Ladakhi" },
        { name: "Apricot - Hunza", hsn: "0813", variety: "Hunza" },

        // Makhana varieties
        { name: "Fox Nuts (Makhana) - 4 Sut", hsn: "0812", variety: "4 Sut (Large)" },
        { name: "Fox Nuts (Makhana) - 3 Sut", hsn: "0812", variety: "3 Sut (Medium)" },
        { name: "Fox Nuts (Makhana) - 2 Sut", hsn: "0812", variety: "2 Sut (Small)" },
        { name: "Fox Nuts (Makhana) - Roasted", hsn: "0812", variety: "Roasted" },

        { name: "Brazil Nuts - In Shell", hsn: "0801", variety: "In Shell" },
        { name: "Brazil Nuts - Kernels", hsn: "0801", variety: "Kernels" },
        { name: "Hazelnuts - In Shell", hsn: "0802", variety: "In Shell" },
        { name: "Hazelnuts - Blanched", hsn: "0802", variety: "Blanched" },
        { name: "Pecans - Halves", hsn: "0802", variety: "Halves" },
        { name: "Pecans - Pieces", hsn: "0802", variety: "Pieces" },
        { name: "Pine Nuts (Chilgoza)", hsn: "0802", variety: "Standard" },
        { name: "Prunes - Pitted", hsn: "0813", variety: "Pitted" },
        { name: "Prunes - Unpitted", hsn: "0813", variety: "Unpitted" },
        { name: "Dry Coconut - Whole", hsn: "0801", variety: "Whole" },
        { name: "Dry Coconut - Copra", hsn: "0801", variety: "Copra" },
        { name: "Dry Coconut - Desiccated", hsn: "0801", variety: "Desiccated" }
    ]
};

// Flatten catalog for search
const ALL_PRODUCTS = [
    ...PRODUCT_CATALOG.spices.map(p => ({ ...p, category: 'Spices' })),
    ...PRODUCT_CATALOG.vegetables.map(p => ({ ...p, category: 'Vegetables' })),
    ...PRODUCT_CATALOG.pulses.map(p => ({ ...p, category: 'Pulses' })),
    ...PRODUCT_CATALOG.dry_fruits_and_nuts.map(p => ({ ...p, category: 'Dry Fruits & Nuts' })),
];

type CatalogProduct = { name: string; hsn: string; category: string; variety: string };

// Quality Grades for products
const QUALITY_GRADES = [
    { value: 'export_premium', label: 'Export Premium Quality', description: 'Highest grade for international export' },
    { value: 'export', label: 'Export Quality', description: 'Standard export grade' },
    { value: 'premium', label: 'Premium Quality', description: 'Top domestic grade' },
    { value: 'premium_split', label: 'Premium Split', description: 'Premium grade split/broken' },
    { value: 'export_split', label: 'Export Split', description: 'Export grade split/broken' },
    { value: 'standard', label: 'Standard Quality', description: 'Regular domestic grade' },
    { value: 'commercial', label: 'Commercial Grade', description: 'Bulk commercial use' },
    { value: 'reject', label: 'Reject Quality', description: 'Lower grade/rejected' },
    { value: 'faq', label: 'FAQ (Fair Average Quality)', description: 'Average market quality' },
    { value: 'aq', label: 'AQ (Average Quality)', description: 'Average quality' },
    { value: 'machine_cleaned', label: 'Machine Cleaned', description: 'Machine processed' },
    { value: 'hand_picked', label: 'Hand Picked/Sorted', description: 'Manually sorted premium' },
    { value: 'bold', label: 'Bold Grade', description: 'Larger size grade' },
    { value: 'medium', label: 'Medium Grade', description: 'Medium size grade' },
    { value: 'small', label: 'Small Grade', description: 'Smaller size grade' },
];

// Indian States and Union Territories
const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const COUNTRIES = [
    'India',
    'United States',
    'United Kingdom',
    'China',
    'Germany',
    'Japan',
    'France',
    'Italy',
    'Canada',
    'Australia',
    'Brazil',
    'South Korea',
    'Netherlands',
    'Spain',
    'Russia',
    'Mexico',
    'Indonesia',
    'Turkey',
    'Saudi Arabia',
    'Switzerland',
    'Belgium',
    'Argentina',
    'Sweden',
    'Ireland',
    'Israel',
    'Norway',
    'United Arab Emirates',
    'South Africa',
    'Egypt',
    'Bangladesh',
    'Vietnam',
    'Philippines',
    'Chile',
    'Finland',
    'Romania',
    'Czech Republic',
    'New Zealand',
    'Peru',
    'Iraq',
    'Portugal',
    'Greece',
    'Qatar',
    'Algeria',
    'Kazakhstan',
    'Hungary',
    'Kuwait',
    'Morocco',
    'Ecuador',
    'Ukraine',
    'Slovakia',
    'Dominican Republic',
    'Kenya',
    'Ethiopia',
    'Guatemala',
    'Oman',
    'Bulgaria',
    'Ghana',
    'Venezuela',
    'Croatia',
    'Luxembourg',
    'Uruguay',
    'Costa Rica',
    'Panama',
    'Lithuania',
    'Slovenia',
    'Tunisia',
    'Tanzania',
    'Belarus',
    'Serbia',
    'Azerbaijan',
    'Jordan',
    'Paraguay',
    'Latvia',
    'Estonia',
    'Uganda',
    'Lebanon',
    'Cameroon',
    'Bolivia',
    'Libya',
    'Nepal',
    'Nicaragua',
    'El Salvador',
    'Honduras',
    'Senegal',
    'Zimbabwe',
    'Zambia',
    'Mali',
    'Rwanda',
    'Guinea',
    'Benin',
    'Burundi',
    'Tunisia',
    'Cuba',
    'Haiti',
    'Chad',
    'Sierra Leone',
    'Togo',
    'Libya',
    'Liberia',
    'Central African Republic',
    'Mauritania',
    'Eritrea',
    'Gambia',
    'Botswana',
    'Gabon',
    'Lesotho',
    'Guinea-Bissau',
    'Equatorial Guinea',
    'Mauritius',
    'Eswatini',
    'Djibouti',
    'Comoros',
    'Cape Verde',
    'Sao Tome and Principe',
    'Seychelles'
];

const INCOTERMS = [
    { code: 'EXW', name: 'Ex Works' },
    { code: 'FCA', name: 'Free Carrier' },
    { code: 'CPT', name: 'Carriage Paid To' },
    { code: 'CIP', name: 'Carriage and Insurance Paid To' },
    { code: 'DAP', name: 'Delivered At Place' },
    { code: 'DPU', name: 'Delivered at Place Unloaded' },
    { code: 'DDP', name: 'Delivered Duty Paid' },
    { code: 'FAS', name: 'Free Alongside Ship' },
    { code: 'FOB', name: 'Free On Board' },
    { code: 'CFR', name: 'Cost and Freight' },
    { code: 'CIF', name: 'Cost, Insurance and Freight' }
];

function BuyerDashboardContent() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentTab = searchParams.get('tab') || 'items'; // Default to items (Browse Items)
    const { toast } = useToast();
    const [items, setItems] = useState<Item[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [bids, setBids] = useState<Bid[]>([]);
    const [shippingBids, setShippingBids] = useState<ShippingBid[]>([]);
    const [loading, setLoading] = useState(true);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
    const [isItemDetailsDialogOpen, setIsItemDetailsDialogOpen] = useState(false);
    const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
    const [orderForm, setOrderForm] = useState({
        quantity: '',
        shippingAddress: '',
        notes: '',
    });
    const [productForm, setProductForm] = useState({
        name: '',
        description: '',
        price: '',
        size: '',
        category: '',
        condition: 'new' as 'new' | 'used' | 'refurbished',
        quality: '' as string,
        quantity: '',
        specifications: {} as Record<string, string>,
    });
    const [specKey, setSpecKey] = useState('');
    const [specValue, setSpecValue] = useState('');

    // Catalog search states
    const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isSelectProductDialogOpen, setIsSelectProductDialogOpen] = useState(false);

    // Item browsing filters
    const [itemSearchQuery, setItemSearchQuery] = useState('');
    const [itemCategoryFilter, setItemCategoryFilter] = useState<string>('all');

    // Place Bid form (enhanced)
    const [isPlaceBidDialogOpen, setIsPlaceBidDialogOpen] = useState(false);
    const [bidForm, setBidForm] = useState({
        productName: '',
        hsnCode: '',
        size: '',
        specification: '',
        quality: '',
        quantity: '',
        expectedDeliveryDate: '',
        pincode: '',
        city: '',
        state: '',
        country: 'India',
        incoterms: '',
        shippingAddress: '',
        notes: '',
        sellerBidRunningTime: '', // Phase 1: Seller bid running time in days
        shippingBidRunningTime: '', // Phase 2: Shipping bid running time in days
    });
    const [selectedCatalogProduct, setSelectedCatalogProduct] = useState<CatalogProduct | null>(null);

    // Add to List Dialog
    const [isAddToListDialogOpen, setIsAddToListDialogOpen] = useState(false);
    const [addToListForm, setAddToListForm] = useState({
        productName: '',
        hsnCode: '',
        size: '',
        specification: '',
        quality: '',
        quantity: '',
        expectedDeliveryDate: '',
        pincode: '',
        city: '',
        state: '',
        country: 'India',
        incoterms: '',
        shippingAddress: '',
        notes: '',
    });
    const [selectedProductForList, setSelectedProductForList] = useState<CatalogProduct | null>(null);

    // "My Bids" pagination
    const [myBidsVisibleCount, setMyBidsVisibleCount] = useState(10);
    const [openDropdowns, setOpenDropdowns] = useState<{ [key: string]: boolean }>({});

    // Enhanced search and filtering states for My Bids
    const [myBidsSearchQuery, setMyBidsSearchQuery] = useState('');
    const [myBidsSortBy, setMyBidsSortBy] = useState<'date' | 'quantity' | 'ending' | 'name'>('date');
    const [myBidsSortDirection, setMyBidsSortDirection] = useState<'asc' | 'desc'>('desc');
    const [myBidsShowAll, setMyBidsShowAll] = useState(false);

    // Enhanced search and filtering states for Live Bids
    const [liveBidsSearchQuery, setLiveBidsSearchQuery] = useState('');
    const [liveBidsSortBy, setLiveBidsSortBy] = useState<'date' | 'amount' | 'ending' | 'delivery'>('ending');
    const [liveBidsSortDirection, setLiveBidsSortDirection] = useState<'asc' | 'desc'>('asc');
    const [liveBidsShowAll, setLiveBidsShowAll] = useState(false);

    // Filter and sort Live Bids
    const filteredAndSortedLiveBids = useMemo(() => {
        console.log('=== Live Bids Filtering Debug ===');
        console.log('Total bids:', bids.length);
        console.log('All bids:', bids);

        const liveBidsData = Object.values(
            bids.filter(b => b.status === 'pending').reduce((acc, bid) => {
                if (!acc[bid.orderId] || bid.bidAmount < acc[bid.orderId].bidAmount) {
                    acc[bid.orderId] = bid;
                }
                return acc;
            }, {} as Record<string, Bid>)
        );

        console.log('Pending bids:', bids.filter(b => b.status === 'pending'));
        console.log('Live bids data (lowest per order):', liveBidsData);

        let filtered = liveBidsData.filter(bid => {
            if (!liveBidsSearchQuery) return true;
            const query = liveBidsSearchQuery.toLowerCase();
            const order = orders.find(o => o.id === bid.orderId);
            return (
                order?.item?.name?.toLowerCase().includes(query) ||
                bid.orderId.toLowerCase().includes(query) ||
                bid.sellerId?.toLowerCase().includes(query) ||
                order?.shippingAddress?.toLowerCase().includes(query)
            );
        });

        console.log('Filtered bids:', filtered);

        // Sort Live Bids by total cost (seller bid + shipping bid)
        filtered.sort((a, b) => {
            let aValue: any, bValue: any;
            const aOrder = orders.find(o => o.id === a.orderId);
            const bOrder = orders.find(o => o.id === b.orderId);

            // Get shipping bids for each order
            const aShippingBids = shippingBids.filter(sb => sb.orderId === a.orderId && sb.status === 'pending');
            const bShippingBids = shippingBids.filter(sb => sb.orderId === b.orderId && sb.status === 'pending');
            const aLowestShipping = aShippingBids.length > 0 ? Math.min(...aShippingBids.map(sb => sb.bidAmount)) : 0;
            const bLowestShipping = bShippingBids.length > 0 ? Math.min(...bShippingBids.map(sb => sb.bidAmount)) : 0;
            const aTotalCost = a.bidAmount + aLowestShipping;
            const bTotalCost = b.bidAmount + bLowestShipping;

            switch (liveBidsSortBy) {
                case 'date':
                    aValue = new Date(a.createdAt);
                    bValue = new Date(b.createdAt);
                    break;
                case 'amount':
                    // Sort by total cost (seller bid + shipping bid)
                    aValue = aTotalCost;
                    bValue = bTotalCost;
                    break;
                case 'delivery':
                    aValue = new Date(a.estimatedDelivery);
                    bValue = new Date(b.estimatedDelivery);
                    break;
                case 'ending':
                    const aSpecs = aOrder?.item?.specifications as any;
                    const bSpecs = bOrder?.item?.specifications as any;
                    const aBidTime = aSpecs?.['Bid Running Time (days)'] || '0';
                    const bBidTime = bSpecs?.['Bid Running Time (days)'] || '0';
                    aValue = new Date(new Date(aOrder?.createdAt || a.createdAt).getTime() + (parseInt(aBidTime) * 24 * 60 * 60 * 1000));
                    bValue = new Date(new Date(bOrder?.createdAt || b.createdAt).getTime() + (parseInt(bBidTime) * 24 * 60 * 60 * 1000));
                    break;
                default:
                    aValue = new Date(a.createdAt);
                    bValue = new Date(b.createdAt);
            }

            if (liveBidsSortDirection === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        console.log('Final sorted bids:', filtered);
        console.log('=== End Live Bids Filtering Debug ===');

        return filtered;
    }, [bids, shippingBids, orders, liveBidsSearchQuery, liveBidsSortBy, liveBidsSortDirection]);

    // Reset filter functions
    const resetMyBidsFilters = () => {
        setMyBidsSearchQuery('');
        setMyBidsSortBy('date');
        setMyBidsSortDirection('desc');
    };

    const resetLiveBidsFilters = () => {
        setLiveBidsSearchQuery('');
        setLiveBidsSortBy('ending');
        setLiveBidsSortDirection('asc');
    };

    // Calculate bid end time based on order creation and bid running time
    const calculateBidEndTime = (order: Order | undefined) => {
        if (!order) return new Date();

        const createdAt = new Date(order.createdAt);
        const bidRunningDays = 7; // Default 7 days if not specified

        // Try to get bid running time from specifications
        const specs = order.item?.specifications as any;
        const specifiedDays = specs?.['Seller Bid Running Time (days)'] || specs?.['Bid Running Time (days)'] || specs?.['bidRunningTime'];
        const daysToAdd = specifiedDays ? parseInt(specifiedDays.toString()) : bidRunningDays;

        const endTime = new Date(createdAt.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
        return endTime;
    };

    // Function to calculate remaining time for bids
    const calculateRemainingTime = (createdAt: string, bidRunningTimeDays: string | number) => {
        if (!createdAt || !bidRunningTimeDays) return 'N/A';

        try {
            const createdDate = new Date(createdAt);
            const bidDays = typeof bidRunningTimeDays === 'string' ? parseInt(bidRunningTimeDays) : bidRunningTimeDays;

            if (isNaN(bidDays)) return 'N/A';

            const endDate = new Date(createdDate.getTime() + (bidDays * 24 * 60 * 60 * 1000));
            const now = new Date();
            const remainingMs = endDate.getTime() - now.getTime();

            if (remainingMs <= 0) return 'Expired';

            const remainingDays = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
            const remainingHours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
            const remainingMinutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

            if (remainingDays > 0) {
                return `${remainingDays}d ${remainingHours}h`;
            } else if (remainingHours > 0) {
                return `${remainingHours}h ${remainingMinutes}m`;
            } else {
                return `${remainingMinutes}m`;
            }
        } catch (error) {
            return 'N/A';
        }
    };

    const myBidOrders = useMemo(() => {
        // Treat orders with totalPrice === 0 or notes mentioning "bid request" as bid requests created by the buyer
        return orders.filter((order) => {
            const isBidRequestPrice = !order.totalPrice || order.totalPrice === 0;
            const notesLower = order.notes?.toLowerCase() || '';
            const isBidRequestNotes = notesLower.includes('bid request');
            return isBidRequestPrice || isBidRequestNotes;
        });
    }, [orders]);

    // Filter and sort My Bids (must come after myBidOrders)
    const filteredAndSortedMyBids = useMemo(() => {
        let filtered = myBidOrders.filter(order => {
            if (!myBidsSearchQuery) return true;
            const query = myBidsSearchQuery.toLowerCase();
            return (
                order.item?.name?.toLowerCase().includes(query) ||
                order.id.toLowerCase().includes(query) ||
                (order.item?.specifications as any)?.['HSN Code']?.toLowerCase().includes(query) ||
                order.shippingAddress?.toLowerCase().includes(query)
            );
        });

        // Sort My Bids
        filtered.sort((a, b) => {
            let aValue: any, bValue: any;

            switch (myBidsSortBy) {
                case 'date':
                    aValue = new Date(a.createdAt);
                    bValue = new Date(b.createdAt);
                    break;
                case 'quantity':
                    aValue = a.quantity || 0;
                    bValue = b.quantity || 0;
                    break;
                case 'name':
                    aValue = (a.item?.name || '').toLowerCase();
                    bValue = (b.item?.name || '').toLowerCase();
                    break;
                case 'ending':
                    const aSpecs = a.item?.specifications as any;
                    const bSpecs = b.item?.specifications as any;
                    const aBidTime = aSpecs?.['Bid Running Time (days)'] || '0';
                    const bBidTime = bSpecs?.['Bid Running Time (days)'] || '0';
                    aValue = new Date(new Date(a.createdAt).getTime() + (parseInt(aBidTime) * 24 * 60 * 60 * 1000));
                    bValue = new Date(new Date(b.createdAt).getTime() + (parseInt(bBidTime) * 24 * 60 * 60 * 1000));
                    break;
                default:
                    aValue = new Date(a.createdAt);
                    bValue = new Date(b.createdAt);
            }

            if (myBidsSortDirection === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return filtered;
    }, [myBidOrders, myBidsSearchQuery, myBidsSortBy, myBidsSortDirection]);

    const getBidTimeLeftLabel = (order: Order | undefined) => {
        if (!order) return 'N/A';
        const specs = order.item?.specifications || {};
        const runningDaysRaw = (specs as any)['Seller Bid Running Time (days)'] || (specs as any)['Bid Running Time (days)'];
        const runningDays = runningDaysRaw ? parseInt(String(runningDaysRaw)) : NaN;
        if (!runningDays || isNaN(runningDays) || runningDays <= 0) return 'N/A';

        const created = new Date(order.createdAt).getTime();
        const deadline = created + runningDays * 24 * 60 * 60 * 1000;
        const now = Date.now();
        const diffMs = deadline - now;
        if (diffMs <= 0) return 'Expired';

        const diffHoursTotal = Math.floor(diffMs / (1000 * 60 * 60));
        const daysLeft = Math.floor(diffHoursTotal / 24);
        const hoursLeft = diffHoursTotal % 24;

        if (daysLeft > 0) {
            return `${daysLeft}d ${hoursLeft}h left`;
        }
        // Less than 24 hours left
        const diffMinutesTotal = Math.floor(diffMs / (1000 * 60));
        const hoursOnly = Math.floor(diffMinutesTotal / 60);
        const minutesLeft = diffMinutesTotal % 60;
        if (hoursOnly > 0) {
            return `${hoursOnly}h ${minutesLeft}m left`;
        }
        return `${minutesLeft}m left`;
    };

    // Filter catalog products based on search query and category
    const filteredCatalogProducts = useMemo(() => {
        return ALL_PRODUCTS.filter(product => {
            const searchLower = catalogSearchQuery.toLowerCase();
            const matchesSearch = catalogSearchQuery === '' ||
                product.name.toLowerCase().includes(searchLower) ||
                product.hsn.includes(catalogSearchQuery) ||
                product.variety.toLowerCase().includes(searchLower);
            const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [catalogSearchQuery, selectedCategory]);

    // Filter items for browsing based on search and category
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const searchLower = itemSearchQuery.toLowerCase();
            const matchesSearch = itemSearchQuery === '' ||
                item.name.toLowerCase().includes(searchLower) ||
                item.description?.toLowerCase().includes(searchLower) ||
                item.category?.toLowerCase().includes(searchLower);
            const matchesCategory = itemCategoryFilter === 'all' ||
                item.category?.toLowerCase().includes(itemCategoryFilter.toLowerCase());
            return matchesSearch && matchesCategory;
        });
    }, [items, itemSearchQuery, itemCategoryFilter]);

    // Get unique categories from items
    const itemCategories = useMemo(() => {
        const categories = new Set(items.map(item => item.category).filter(Boolean));
        return Array.from(categories);
    }, [items]);

    // Size options for bid form
    // Size options for bid form - simplified to just kg
    const SIZE_OPTIONS = [
        { value: 'kg', label: 'kg' },
    ];

    // Select a product from catalog
    const selectCatalogProduct = (product: CatalogProduct) => {
        setProductForm({
            ...productForm,
            name: product.name,
            category: product.category,
            specifications: {
                ...productForm.specifications,
                'HSN Code': product.hsn,
                'Variety/Grade': product.variety
            }
        });
        setIsSelectProductDialogOpen(false);
        setIsAddProductDialogOpen(true);
        setCatalogSearchQuery('');
        setSelectedCategory('all');
    };

    // Select a product from catalog for bid request
    const selectCatalogProductForBid = (product: CatalogProduct) => {
        setSelectedCatalogProduct(product);
        setBidForm({
            ...bidForm,
            productName: product.name,
            hsnCode: product.hsn,
            specification: product.variety,
        });
        setIsSelectProductDialogOpen(false);
        setCatalogSearchQuery('');
        setSelectedCategory('all');
    };

    // Select a product from catalog for adding to list
    const selectCatalogProductForList = (product: CatalogProduct) => {
        setSelectedProductForList(product);
        setAddToListForm({
            ...addToListForm,
            productName: product.name,
            hsnCode: product.hsn,
            specification: product.variety,
        });
        setIsSelectProductDialogOpen(false);
        setIsAddToListDialogOpen(true);
        setCatalogSearchQuery('');
        setSelectedCategory('all');
    };

    // Add item to saved list AND create in database
    const [addingToList, setAddingToList] = useState(false);

    const handleAddToList = async () => {
        if (!user) {
            toast({
                title: "Error",
                description: "You must be logged in to add items.",
                variant: "destructive",
            });
            return;
        }

        if (!addToListForm.productName || !addToListForm.quantity) {
            toast({
                title: "Validation Error",
                description: "Please fill in at least Product Name and Quantity.",
                variant: "destructive",
            });
            return;
        }

        const quantity = parseInt(addToListForm.quantity);
        if (isNaN(quantity) || quantity <= 0) {
            toast({
                title: "Validation Error",
                description: "Please enter a valid quantity.",
                variant: "destructive",
            });
            return;
        }

        setAddingToList(true);
        try {
            // Create the item in the database so it appears in the items grid
            await createItem({
                name: addToListForm.productName,
                description: `${addToListForm.specification || addToListForm.productName}${addToListForm.notes ? ` - ${addToListForm.notes}` : ''}`,
                image: '/api/placeholder/400/300',
                price: 0, // Price will be determined by bids
                size: addToListForm.size || 'As specified',
                category: selectedProductForList?.category || 'General',
                condition: 'new',
                quantity: quantity,
                specifications: {
                    ...(addToListForm.hsnCode && { 'HSN Code': addToListForm.hsnCode }),
                    ...(addToListForm.specification && { 'Specification': addToListForm.specification }),
                    ...(addToListForm.quality && { 'Quality Grade': QUALITY_GRADES.find(g => g.value === addToListForm.quality)?.label || addToListForm.quality }),
                    ...(addToListForm.expectedDeliveryDate && { 'Expected Delivery': addToListForm.expectedDeliveryDate }),
                    'Destination Country': addToListForm.country,
                    ...(addToListForm.country !== 'India' && addToListForm.incoterms && { 'Incoterms': `${addToListForm.incoterms} - ${INCOTERMS.find(i => i.code === addToListForm.incoterms)?.name || addToListForm.incoterms}` }),
                    ...(addToListForm.country === 'India' && addToListForm.city && addToListForm.state && { 'Location': `${addToListForm.city}, ${addToListForm.state} - ${addToListForm.pincode}` }),
                    ...(addToListForm.country !== 'India' && addToListForm.city && { 'Location': `${addToListForm.city}${addToListForm.state ? ', ' + addToListForm.state : ''}, ${addToListForm.country}` }),
                },
                sellerId: user.id, // Buyer creates the item
                status: 'active',
            });

            toast({
                title: "Item Added! 🎉",
                description: `${addToListForm.productName} has been added and is now visible in the items list.`,
            });

            setIsAddToListDialogOpen(false);
            setAddToListForm({
                productName: '',
                hsnCode: '',
                size: '',
                specification: '',
                quality: '',
                quantity: '',
                expectedDeliveryDate: '',
                pincode: '',
                city: '',
                state: '',
                country: 'India',
                incoterms: '',
                shippingAddress: '',
                notes: '',
            });
            setSelectedProductForList(null);

            // Refresh to show the new item in the grid
            await fetchData();
        } catch (error: any) {
            console.error('Error adding item:', error);
            toast({
                title: "Error",
                description: error?.message || "Failed to add item. Please try again.",
                variant: "destructive",
            });
        } finally {
            setAddingToList(false);
        }
    };

    useEffect(() => {
        // Wait for auth to finish loading
        if (authLoading) {
            return;
        }

        // If no user after auth is done loading, redirect to login
        if (!user) {
            console.log('No user found, redirecting to auth');
            router.replace('/auth?role=buyer');
            return;
        }

        // If user is not a buyer, redirect to their dashboard
        if (user.role !== 'buyer') {
            console.log('User is not a buyer, redirecting to:', user.role);
            router.replace(`/dashboard/${user.role}`);
            return;
        }
    }, [user, authLoading, router]);

    const fetchData = useCallback(async (forceRefresh = false, retryCount = 0) => {
        if (!user) {
            console.log('fetchData: No user, skipping and ensuring loading is false');
            setLoading(false); // Ensure loading is stopped
            return;
        }

        console.log('fetchData: Starting...', { forceRefresh, userId: user.id, retryCount });

        try {
            setLoading(true);

            // Clear cache on force refresh (hard refresh)
            if (forceRefresh) {
                console.log('fetchData: Clearing cache...');
                LocalCache.remove(CacheKeys.orders(user.id));
                LocalCache.remove(CacheKeys.bids(user.id));
                LocalCache.remove(CacheKeys.shippingBids(user.id));
                LocalCache.remove(CacheKeys.items());
            }

            // Always fetch fresh data for buyer dashboard (real-time is critical)
            console.log('Fetching fresh data from Supabase');

            let freshItems: any[] = [];
            let freshOrders: any[] = [];

            try {
                const results = await Promise.all([
                    getActiveItems().catch(err => {
                        console.error('Error fetching items:', err);
                        return [];
                    }),
                    getOrdersByBuyer(user.id).catch(err => {
                        console.error('Error fetching orders:', err);
                        return [];
                    }),
                ]);

                freshItems = results[0];
                freshOrders = results[1];

                console.log('fetchData: Fetched items:', freshItems.length, 'orders:', freshOrders.length);
            } catch (err) {
                console.error('Error in Promise.all for items/orders:', err);

                // Retry logic for critical failures
                if (retryCount < 2) {
                    console.log(`Retrying data fetch (attempt ${retryCount + 1})...`);
                    await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
                    return fetchData(forceRefresh, retryCount + 1);
                }

                // If retries fail, show error but continue with empty arrays
                toast({
                    title: "Connection Issue",
                    description: "Having trouble loading some data. Please check your connection.",
                    variant: "destructive",
                });
            }

            setItems(freshItems);
            setOrders(freshOrders);

            // **OPTIMIZED**: Batch fetch all bids in a single query instead of per-order
            let allBids: any[] = [];
            let allShippingBids: any[] = [];

            if (freshOrders.length > 0) {
                try {
                    // Extract all order IDs for batch querying
                    const orderIds = freshOrders.map(order => order.id);

                    console.log(`Batch fetching bids for ${orderIds.length} orders...`);

                    // **PERFORMANCE IMPROVEMENT**: Single query for all bids instead of N queries
                    // This reduces API calls from O(n) to O(1)
                    const [bidsResult, shippingBidsResult] = await Promise.all([
                        // Fetch all seller bids for these orders in one query
                        supabase
                            .from('bids')
                            .select('*')
                            .in('order_id', orderIds)
                            .order('created_at', { ascending: false })
                            .then(({ data, error }) => {
                                if (error) throw error;
                                return data || [];
                            })
                            .catch(err => {
                                console.error('Error batch fetching bids:', err);
                                return [];
                            }),

                        // Fetch all shipping bids for these orders in one query
                        supabase
                            .from('shipping_bids')
                            .select('*')
                            .in('order_id', orderIds)
                            .order('created_at', { ascending: false })
                            .then(({ data, error }) => {
                                if (error) throw error;
                                return data || [];
                            })
                            .catch(err => {
                                console.error('Error batch fetching shipping bids:', err);
                                return [];
                            })
                    ]);

                    // Convert from snake_case to camelCase
                    allBids = (bidsResult as any[]).map(bid => ({
                        id: bid.id,
                        orderId: bid.order_id,
                        sellerId: bid.seller_id,
                        bidAmount: bid.bid_amount,
                        estimatedDelivery: bid.estimated_delivery,
                        message: bid.message,
                        pickupAddress: bid.pickup_address,
                        status: bid.status,
                        createdAt: bid.created_at,
                        updatedAt: bid.updated_at
                    }));

                    allShippingBids = (shippingBidsResult as any[]).map(bid => ({
                        id: bid.id,
                        orderId: bid.order_id,
                        shippingProviderId: bid.shipping_provider_id,
                        bidAmount: bid.bid_amount,
                        estimatedDelivery: bid.estimated_delivery,
                        message: bid.message,
                        quantityKgs: bid.quantity_kgs,
                        portOfLoading: bid.port_of_loading,
                        destinationAddress: bid.destination_address,
                        incoterms: bid.incoterms,
                        mode: bid.mode,
                        status: bid.status,
                        createdAt: bid.created_at,
                        updatedAt: bid.updated_at
                    }));

                    console.log(`fetchData: Batch fetched ${allBids.length} seller bids and ${allShippingBids.length} shipping bids`);
                } catch (err) {
                    console.error('Error batch fetching bids:', err);
                    // Continue with empty arrays rather than failing completely
                }
            }

            setBids(allBids);
            setShippingBids(allShippingBids);

            // Process auto-accepts for expired bids (don't await, run in background)
            processAutoAccepts(freshOrders, allBids, allShippingBids).then((result) => {
                if (result.sellerAccepted > 0 || result.shippingAccepted > 0) {
                    console.log(`Auto-accepted: ${result.sellerAccepted} seller bids, ${result.shippingAccepted} shipping bids`);
                    toast({
                        title: "Bids Auto-Accepted",
                        description: `${result.sellerAccepted} seller bid(s) and ${result.shippingAccepted} shipping bid(s) were automatically accepted due to time expiration.`,
                    });
                    // Refresh data after auto-accept (after a short delay)
                    setTimeout(() => fetchData(true), 1500);
                }
            }).catch(err => {
                console.error('Error in auto-accept:', err);
            });

            console.log('fetchData: Success!');

        } catch (error: any) {
            console.error('Error fetching data:', error);
            toast({
                title: "Error Loading Data",
                description: error?.message || "Failed to load dashboard data. Please try refreshing the page.",
                variant: "destructive",
            });
        } finally {
            console.log('fetchData: Setting loading to false');
            setLoading(false);
        }
    }, [user, toast]);

    // Separate effect for fetching data on mount
    useEffect(() => {
        if (user && user.role === 'buyer') {
            // User is authenticated and is a buyer, fetch data
            console.log('Buyer authenticated, fetching data');
            fetchData(true); // Force refresh on mount to clear any stale cache
        }
    }, [user, fetchData]);

    // Auto-refresh DISABLED - Only manual refresh on page reload or refresh button
    // useEffect(() => {
    //     if (!user || user.role !== 'buyer') return;
    //     const intervalId = setInterval(() => {
    //         console.log('Auto-refreshing data...');
    //         fetchData(false);
    //     }, 60000);
    //     return () => clearInterval(intervalId);
    // }, [user, fetchData]);

    // Safety timeout: Force stop loading after 8 seconds to prevent stuck state
    useEffect(() => {
        if (!loading) return;

        const timeoutId = setTimeout(() => {
            if (loading) {
                console.warn('Loading timeout - stopping loading state');
                setLoading(false);
                // Don't show toast - this is a safety mechanism and data might have loaded anyway
            }
        }, 8000); // 8 seconds timeout

        return () => clearTimeout(timeoutId);
    }, [loading]);

    const handlePlaceOrder = async () => {
        if (!selectedItem || !user) {
            toast({
                title: "Error",
                description: "Please select an item to order.",
                variant: "destructive",
            });
            return;
        }

        if (!orderForm.quantity || !orderForm.shippingAddress) {
            toast({
                title: "Validation Error",
                description: "Please fill in quantity and shipping address.",
                variant: "destructive",
            });
            return;
        }

        const quantity = parseInt(orderForm.quantity);
        if (isNaN(quantity) || quantity <= 0) {
            toast({
                title: "Validation Error",
                description: "Please enter a valid quantity.",
                variant: "destructive",
            });
            return;
        }

        if (quantity > selectedItem.quantity) {
            toast({
                title: "Insufficient Stock",
                description: `Only ${selectedItem.quantity} units available.`,
                variant: "destructive",
            });
            return;
        }

        setPlacingOrder(true);
        try {
            const newOrder = await createOrder({
                itemId: selectedItem.id,
                buyerId: user.id,
                quantity: quantity,
                totalPrice: selectedItem.price * quantity,
                status: 'pending',
                shippingAddress: orderForm.shippingAddress,
                notes: orderForm.notes || undefined,
            });

            toast({
                title: "Order Placed Successfully! 🎉",
                description: `Your order for ${selectedItem.name} has been placed. Sellers can now bid on it.`,
            });

            setIsOrderDialogOpen(false);
            setOrderForm({ quantity: '', shippingAddress: '', notes: '' });
            setSelectedItem(null);

            // Refresh data immediately
            await fetchData();
        } catch (error: any) {
            console.error('Error creating order:', error);
            toast({
                title: "Error",
                description: error?.message || "Failed to create order. Please try again.",
                variant: "destructive",
            });
        } finally {
            setPlacingOrder(false);
        }
    };

    const [placingBidRequest, setPlacingBidRequest] = useState(false);

    const handlePlaceBidRequest = async () => {
        if (!user) {
            toast({
                title: "Error",
                description: "You must be logged in to place a bid request.",
                variant: "destructive",
            });
            return;
        }

        // Validation
        const isIndia = bidForm.country === 'India';

        // Basic required fields
        if (!bidForm.productName || !bidForm.quantity || !bidForm.shippingAddress || !bidForm.expectedDeliveryDate || !bidForm.sellerBidRunningTime || !bidForm.shippingBidRunningTime || !bidForm.country || !bidForm.city) {
            toast({
                title: "Validation Error",
                description: "Please fill in all required fields (Product, Quantity, Country, City, Shipping Address, Expected Delivery Date, Seller Bid Time, Shipping Bid Time).",
                variant: "destructive",
            });
            return;
        }

        // India-specific validation
        if (isIndia) {
            if (!bidForm.pincode || !bidForm.state) {
                toast({
                    title: "Validation Error",
                    description: "Please fill in Pincode and State for Indian addresses.",
                    variant: "destructive",
                });
                return;
            }

            // Validate pincode (6 digits for India)
            if (bidForm.pincode.length !== 6) {
                toast({
                    title: "Validation Error",
                    description: "Please enter a valid 6-digit pincode.",
                    variant: "destructive",
                });
                return;
            }
        } else {
            // International order validation
            if (!bidForm.incoterms) {
                toast({
                    title: "Validation Error",
                    description: "Please select Incoterms for international shipments.",
                    variant: "destructive",
                });
                return;
            }
        }

        const quantity = parseInt(bidForm.quantity);
        if (isNaN(quantity) || quantity <= 0) {
            toast({
                title: "Validation Error",
                description: "Please enter a valid quantity.",
                variant: "destructive",
            });
            return;
        }

        // Validate seller bid running time (in days)
        const sellerBidDays = parseInt(bidForm.sellerBidRunningTime);
        if (isNaN(sellerBidDays) || sellerBidDays <= 0) {
            toast({
                title: "Validation Error",
                description: "Please enter a valid seller bid running time (must be at least 1 day).",
                variant: "destructive",
            });
            return;
        }

        // Validate shipping bid running time (in days)
        const shippingBidDays = parseInt(bidForm.shippingBidRunningTime);
        if (isNaN(shippingBidDays) || shippingBidDays <= 0) {
            toast({
                title: "Validation Error",
                description: "Please enter a valid shipping bid running time (must be at least 1 day).",
                variant: "destructive",
            });
            return;
        }

        setPlacingBidRequest(true);
        try {
            // First create the item if it doesn't exist
            // Note: For bid requests, we don't set sellerId since buyer is creating it
            const newItem = await createItem({
                name: bidForm.productName,
                description: `Bid Request: ${bidForm.productName}${bidForm.specification ? ` - ${bidForm.specification}` : ''}`,
                image: '/api/placeholder/400/300',
                price: 0, // Price will be determined by bids
                size: bidForm.size || 'As specified',
                category: selectedCatalogProduct?.category || 'General',
                condition: 'new',
                quantity: quantity,
                specifications: {
                    ...(bidForm.hsnCode && { 'HSN Code': bidForm.hsnCode }),
                    ...(bidForm.specification && { 'Specification': bidForm.specification }),
                    ...(bidForm.quality && { 'Quality Grade': QUALITY_GRADES.find(g => g.value === bidForm.quality)?.label || bidForm.quality }),
                    'Expected Delivery': bidForm.expectedDeliveryDate,
                    'Destination Country': bidForm.country,
                    ...(bidForm.country !== 'India' && bidForm.incoterms && { 'Incoterms': `${bidForm.incoterms} - ${INCOTERMS.find(i => i.code === bidForm.incoterms)?.name || bidForm.incoterms}` }),
                    'Seller Bid Running Time (days)': String(sellerBidDays),
                    'Shipping Bid Running Time (days)': String(shippingBidDays),
                },
                sellerId: null as any, // Bid request items don't have a seller initially
                status: 'active',
            });

            // Then create the order/bid request
            const isIndia = bidForm.country === 'India';
            const locationInfo = isIndia
                ? `${bidForm.city}, ${bidForm.state} - ${bidForm.pincode}`
                : `${bidForm.city}, ${bidForm.state ? bidForm.state + ', ' : ''}${bidForm.country}`;
            const fullAddress = `${bidForm.shippingAddress}, ${locationInfo}`;

            const orderNotes = [
                `Bid request for ${bidForm.productName}.`,
                `Quality: ${bidForm.quality || 'Not specified'}.`,
                `Size: ${bidForm.size || 'Not specified'}.`,
                `Destination: ${bidForm.country}`,
                !isIndia ? `Incoterms: ${bidForm.incoterms}` : '',
                bidForm.notes ? `Additional Notes: ${bidForm.notes}` : ''
            ].filter(Boolean).join(' ');

            await createOrder({
                itemId: newItem.id,
                buyerId: user.id,
                quantity: quantity,
                totalPrice: 0, // Will be determined by accepted bid
                status: 'pending',
                shippingAddress: fullAddress,
                notes: orderNotes,
            });

            toast({
                title: "Bid Request Placed! 🎉",
                description: `Your bid request for ${bidForm.productName} has been placed. Sellers can now submit their bids.`,
            });

            setIsPlaceBidDialogOpen(false);
            setBidForm({
                productName: '',
                hsnCode: '',
                size: '',
                specification: '',
                quality: '',
                quantity: '',
                expectedDeliveryDate: '',
                pincode: '',
                city: '',
                state: '',
                country: 'India',
                incoterms: '',
                shippingAddress: '',
                notes: '',
                sellerBidRunningTime: '',
                shippingBidRunningTime: '',
            });
            setSelectedCatalogProduct(null);

            await fetchData();
        } catch (error: any) {
            console.error('Error creating bid request:', error);
            toast({
                title: "Error",
                description: error?.message || "Failed to place bid request. Please try again.",
                variant: "destructive",
            });
        } finally {
            setPlacingBidRequest(false);
        }
    };

    const handleAcceptBid = async (bidId: string) => {
        try {
            const bid = bids.find(b => b.id === bidId);
            if (!bid) {
                toast({
                    title: "Error",
                    description: "Bid not found.",
                    variant: "destructive",
                });
                return;
            }

            // Find the lowest shipping bid for this order
            const orderShippingBids = shippingBids.filter(sb => sb.orderId === bid.orderId && sb.status === 'pending');
            const lowestShippingBid = orderShippingBids.length > 0
                ? orderShippingBids.reduce((lowest, sb) => sb.bidAmount < lowest.bidAmount ? sb : lowest)
                : null;

            // Accept the seller bid
            await updateBid(bidId, { status: 'accepted' });

            // Accept the lowest shipping bid if available
            if (lowestShippingBid) {
                await updateShippingBid(lowestShippingBid.id, { status: 'accepted' });
            }

            // Reject all other bids for this order
            const otherSellerBids = bids.filter(b => b.orderId === bid.orderId && b.id !== bidId && b.status === 'pending');
            const otherShippingBids = shippingBids.filter(sb => sb.orderId === bid.orderId && sb.id !== lowestShippingBid?.id && sb.status === 'pending');

            await Promise.all([
                ...otherSellerBids.map(b => updateBid(b.id, { status: 'rejected' })),
                ...otherShippingBids.map(sb => updateShippingBid(sb.id, { status: 'rejected' }))
            ]);

            // Also update the order status to accepted
            await updateOrder(bid.orderId, { status: 'accepted' });

            // Invalidate cache
            if (user) {
                LocalCache.remove(CacheKeys.orders(user.id));
                LocalCache.remove(CacheKeys.bids(user.id));
                LocalCache.remove(CacheKeys.shippingBids(user.id));
            }

            const totalCost = bid.bidAmount + (lowestShippingBid?.bidAmount || 0);
            toast({
                title: "Bid Accepted! ✅",
                description: `You've accepted the seller bid ($${bid.bidAmount.toFixed(2)})${lowestShippingBid ? ` and shipping bid ($${lowestShippingBid.bidAmount.toFixed(2)})` : ''}. Total: $${totalCost.toFixed(2)}`,
            });

            await fetchData(true);
        } catch (error: any) {
            console.error('Error accepting bid:', error);
            toast({
                title: "Error",
                description: error?.message || "Failed to accept bid. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleRejectBid = async (bidId: string) => {
        try {
            const bid = bids.find(b => b.id === bidId);

            await updateBid(bidId, { status: 'rejected' });

            toast({
                title: "Bid Rejected",
                description: `The bid has been rejected.`,
            });

            await fetchData();
        } catch (error: any) {
            console.error('Error rejecting bid:', error);
            toast({
                title: "Error",
                description: error?.message || "Failed to reject bid. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleDeleteBid = async (bidId: string) => {
        try {
            await deleteBid(bidId);

            toast({
                title: "Bid Deleted",
                description: "The bid has been permanently deleted.",
            });

            await fetchData();
        } catch (error: any) {
            console.error('Error deleting bid:', error);
            toast({
                title: "Error",
                description: error?.message || "Failed to delete bid. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleUpdateOrderStatus = async (orderId: string, newStatus: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled') => {
        try {
            await updateOrder(orderId, { status: newStatus });

            const statusMessages: Record<string, string> = {
                'completed': 'Order marked as completed',
                'cancelled': 'Order cancelled',
                'pending': 'Order status updated',
                'accepted': 'Order accepted',
                'rejected': 'Order rejected',
            };

            toast({
                title: "Status Updated",
                description: statusMessages[newStatus] || "Order status updated successfully.",
            });

            await fetchData();
        } catch (error: any) {
            console.error('Error updating order status:', error);
            toast({
                title: "Error",
                description: error?.message || "Failed to update order status. Please try again.",
                variant: "destructive",
            });
        }
    };

    const [addingProduct, setAddingProduct] = useState(false);

    const handleAddProduct = async () => {
        if (!user) {
            toast({
                title: "Error",
                description: "You must be logged in to add products.",
                variant: "destructive",
            });
            return;
        }

        // Validation
        if (!productForm.name || !productForm.description || !productForm.price ||
            !productForm.size || !productForm.category || !productForm.quantity) {
            toast({
                title: "Validation Error",
                description: "Please fill in all required fields.",
                variant: "destructive",
            });
            return;
        }

        const price = parseFloat(productForm.price);
        const quantity = parseInt(productForm.quantity);

        if (isNaN(price) || price <= 0) {
            toast({
                title: "Validation Error",
                description: "Please enter a valid price.",
                variant: "destructive",
            });
            return;
        }

        if (isNaN(quantity) || quantity <= 0) {
            toast({
                title: "Validation Error",
                description: "Please enter a valid quantity.",
                variant: "destructive",
            });
            return;
        }

        setAddingProduct(true);
        try {
            // Add quality to specifications if selected
            const finalSpecifications = { ...productForm.specifications };
            if (productForm.quality) {
                const qualityLabel = QUALITY_GRADES.find(g => g.value === productForm.quality)?.label || productForm.quality;
                finalSpecifications['Quality Grade'] = qualityLabel;
            }

            await createItem({
                name: productForm.name,
                description: productForm.description,
                image: '/api/placeholder/400/300',
                price: price,
                size: productForm.size,
                category: productForm.category,
                condition: productForm.condition,
                quantity: quantity,
                specifications: finalSpecifications,
                sellerId: user.id,
                status: 'active',
            });

            toast({
                title: "Product Added Successfully! 🎉",
                description: `${productForm.name} has been added to the marketplace.`,
            });

            setIsAddProductDialogOpen(false);
            setProductForm({
                name: '',
                description: '',
                price: '',
                size: '',
                category: '',
                condition: 'new',
                quality: '',
                quantity: '',
                specifications: {},
            });
            setSpecKey('');
            setSpecValue('');

            await fetchData();
        } catch (error: any) {
            console.error('Error creating product:', error);
            toast({
                title: "Error",
                description: error?.message || "Failed to create product. Please try again.",
                variant: "destructive",
            });
        } finally {
            setAddingProduct(false);
        }
    };

    const addSpecification = () => {
        if (specKey && specValue) {
            setProductForm({
                ...productForm,
                specifications: { ...productForm.specifications, [specKey]: specValue }
            });
            setSpecKey('');
            setSpecValue('');
        }
    };

    const removeSpecification = (key: string) => {
        const newSpecs = { ...productForm.specifications };
        delete newSpecs[key];
        setProductForm({ ...productForm, specifications: newSpecs });
    };

    const stats = {
        totalOrders: orders.length,
        confirmedOrders: orders.filter(o => o.status === 'accepted').length,
        deliveryPending: orders.filter(o => o.status === 'accepted' || o.status === 'pending').length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        completedOrders: orders.filter(o => o.status === 'completed').length,
        totalSpent: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.totalPrice || 0), 0),
        activeBids: bids.filter(b => b.status === 'pending').length,
        totalItems: items.length,
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
            accepted: 'bg-blue-500/10 text-blue-600 border-blue-200',
            rejected: 'bg-red-500/10 text-red-600 border-red-200',
            completed: 'bg-green-500/10 text-green-600 border-green-200',
            cancelled: 'bg-gray-500/10 text-gray-600 border-gray-200',
        };
        return colors[status] || 'bg-gray-500/10 text-gray-600 border-gray-200';
    };

    if (authLoading || loading) {
        return (
            <DashboardLayout role="buyer">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
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
        <DashboardLayout role="buyer">
            <Toaster />
            <div className="relative min-h-[calc(100vh-4rem)]">
                {/* Background Effect - Only visible in dark mode */}
                <div className="fixed inset-0 z-0 pointer-events-none opacity-0 dark:opacity-50">
                    <BackgroundBeams />
                </div>

                <div className="relative z-10 space-y-8">
                    {/* Header */}
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                                Welcome back, {user.name}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">Here's what's happening with your orders today.</p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 hover:shadow-md transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</CardTitle>
                                <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                    <ShoppingCart className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalOrders}</div>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">All time orders placed</p>
                            </CardContent>
                        </Card>

                        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 hover:shadow-md transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Confirmed Orders</CardTitle>
                                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.confirmedOrders}</div>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Orders accepted by sellers</p>
                            </CardContent>
                        </Card>

                        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 hover:shadow-md transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Delivery Pending</CardTitle>
                                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.deliveryPending}</div>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Awaiting delivery</p>
                            </CardContent>
                        </Card>

                        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 hover:shadow-md transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Live Bids</CardTitle>
                                <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                    <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.activeBids}</div>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Bids awaiting your response</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Place Bid helper text (replaces previous button) */}
                    <div className="flex justify-start mb-6">
                        <h2 className="text-4xl font-bold text-purple-700 dark:text-purple-300 tracking-tight">
                            Place Bid Request
                        </h2>
                    </div>

                    {/* Main Content - Based on URL tab parameter */}
                    <div className="space-y-6">
                        {/* Browse Items Tab */}
                        {(currentTab === 'items' || !currentTab) && (
                            <div className="space-y-6">
                                {/* Category Filter and Search */}
                                <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
                                    <CardContent className="p-6">
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                {/* Product Name */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="quick-product-name" className="text-sm font-medium">Product Name</Label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            id="quick-product-name"
                                                            placeholder="Enter or search from catalog"
                                                            value={bidForm.productName}
                                                            onChange={(e) => setBidForm({ ...bidForm, productName: e.target.value })}
                                                            className="flex-1"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => setIsSelectProductDialogOpen(true)}
                                                            title="Browse Catalog"
                                                        >
                                                            <Search className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Quantity */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="quick-quantity" className="text-sm font-medium">Quantity</Label>
                                                    <Input
                                                        id="quick-quantity"
                                                        type="number"
                                                        placeholder="Enter quantity"
                                                        value={bidForm.quantity}
                                                        onChange={(e) => setBidForm({ ...bidForm, quantity: e.target.value })}
                                                    />
                                                </div>

                                                {/* Quality */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="quick-quality" className="text-sm font-medium">Quality</Label>
                                                    <Select
                                                        value={bidForm.quality}
                                                        onValueChange={(value) => setBidForm({ ...bidForm, quality: value })}
                                                    >
                                                        <SelectTrigger id="quick-quality">
                                                            <SelectValue placeholder="Select quality" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="premium">Premium Quality</SelectItem>
                                                            <SelectItem value="standard">Standard Quality</SelectItem>
                                                            <SelectItem value="commercial">Commercial Quality</SelectItem>
                                                            <SelectItem value="reject">Reject Quality</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Expected Delivery Date */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="quick-expected-date" className="text-sm font-medium">Expected Date</Label>
                                                    <Input
                                                        id="quick-expected-date"
                                                        type="date"
                                                        value={bidForm.expectedDeliveryDate}
                                                        onChange={(e) => setBidForm({ ...bidForm, expectedDeliveryDate: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            {/* Continue Button */}
                                            <div className="flex justify-end pt-2">
                                                <Button
                                                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8"
                                                    onClick={() => setIsPlaceBidDialogOpen(true)}
                                                    disabled={!bidForm.productName || !bidForm.quantity}
                                                >
                                                    Continue
                                                    <Send className="ml-2 h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* My Bids (below the search/filter card, above Live Bids) */}
                                {myBidOrders.length > 0 && (
                                    <Card className="border border-dashed border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-900/10">
                                        <CardContent className="p-4 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">My Bids</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground">
                                                        Showing {Math.min(myBidsShowAll ? filteredAndSortedMyBids.length : 10, filteredAndSortedMyBids.length)} of {filteredAndSortedMyBids.length}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={resetMyBidsFilters}
                                                        className="text-xs text-muted-foreground hover:text-foreground"
                                                    >
                                                        <X className="h-3 w-3 mr-1" />
                                                        Clear
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Enhanced Search and Filter Controls for My Bids */}
                                            <div className="space-y-3">
                                                {/* Search Bar */}
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <Search className="h-4 w-4 text-gray-400" />
                                                    </div>
                                                    <Input
                                                        type="text"
                                                        placeholder="Search by product name, order ID, HSN code..."
                                                        className="pl-10 h-8 text-sm"
                                                        value={myBidsSearchQuery}
                                                        onChange={(e) => setMyBidsSearchQuery(e.target.value)}
                                                    />
                                                    {myBidsSearchQuery && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="absolute inset-y-0 right-0 pr-2 h-full"
                                                            onClick={() => setMyBidsSearchQuery('')}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>

                                                {/* Sort Controls */}
                                                <div className="flex flex-wrap gap-2 items-center text-xs">
                                                    <Filter className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-muted-foreground">Sort by:</span>
                                                    <Select value={myBidsSortBy} onValueChange={(value: any) => setMyBidsSortBy(value)}>
                                                        <SelectTrigger className="w-[110px] h-6 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="date">Date Created</SelectItem>
                                                            <SelectItem value="quantity">Quantity</SelectItem>
                                                            <SelectItem value="ending">Ending Time</SelectItem>
                                                            <SelectItem value="name">Product Name</SelectItem>
                                                        </SelectContent>
                                                    </Select>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setMyBidsSortDirection(myBidsSortDirection === 'asc' ? 'desc' : 'asc')}
                                                        className="p-1 h-6"
                                                    >
                                                        {myBidsSortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />}
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                {filteredAndSortedMyBids.length === 0 ? (
                                                    <div className="text-center py-4 text-muted-foreground text-sm">
                                                        {myBidOrders.length === 0 ? 'No bids found' : 'No bids match your search'}
                                                    </div>
                                                ) : (
                                                    (myBidsShowAll ? filteredAndSortedMyBids : filteredAndSortedMyBids.slice(0, 10)).map((order, index) => {
                                                        const serial = index + 1;
                                                        const specifications = order.item?.specifications || {};
                                                        const hsnCode = (specifications as any)['HSN Code'] || '-';
                                                        const quality = (specifications as any)['Quality Grade'] || '-';
                                                        const size = order.item?.size || '-';
                                                        const expectedDelivery = (specifications as any)['Expected Delivery'] || '-';
                                                        const sellerBidTime = (specifications as any)['Seller Bid Running Time (days)'] || (specifications as any)['Bid Running Time (days)'] || '-';
                                                        const remainingTime = calculateRemainingTime(order.createdAt, sellerBidTime);
                                                        const pincodeMatch = order.shippingAddress?.match(/(\d{6})(?!.*\d{6})/);
                                                        const pincode = pincodeMatch ? pincodeMatch[1] : '-';

                                                        return (
                                                            <div
                                                                key={order.id}
                                                                className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-md bg-background px-4 py-4 border border-dashed border-purple-200 dark:border-purple-700"
                                                            >
                                                                <div className="flex items-start gap-2 text-sm md:text-base">
                                                                    <span className="font-semibold w-5">{serial}.</span>
                                                                    <div className="space-y-0.5">
                                                                        <p className="font-medium line-clamp-1">
                                                                            {order.item?.name || 'Bid Request'}
                                                                        </p>
                                                                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs md:text-sm text-muted-foreground">
                                                                            <span>HSN: <span className="font-medium text-foreground">{hsnCode}</span></span>
                                                                            <span>Quality: <span className="font-medium text-foreground">{quality}</span></span>
                                                                            <span>Qty: <span className="font-medium text-foreground">{order.quantity}</span></span>
                                                                            <span>Size: <span className="font-medium text-foreground">{size}</span></span>
                                                                            <span>Expected: <span className="font-medium text-foreground">{expectedDelivery}</span></span>
                                                                            <span>Pincode: <span className="font-medium text-foreground">{pincode}</span></span>
                                                                            <span className="flex items-center gap-1">
                                                                                Time Remaining:
                                                                                <ClockTimer
                                                                                    endTime={calculateBidEndTime(order)}
                                                                                    size={16}
                                                                                />
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-end">
                                                                    <DropdownMenu
                                                                        open={openDropdowns[order.id] || false}
                                                                        onOpenChange={(isOpen) =>
                                                                            setOpenDropdowns(prev => ({ ...prev, [order.id]: isOpen }))
                                                                        }
                                                                    >
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                className="h-8 w-8 p-0"
                                                                            >
                                                                                <MoreHorizontal className="h-4 w-4" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end" className="w-48">
                                                                            <DropdownMenuItem
                                                                                onClick={() => {
                                                                                    const specs = order.item?.specifications || {};
                                                                                    setBidForm({
                                                                                        productName: order.item?.name || '',
                                                                                        hsnCode: (specs as any)['HSN Code'] || '',
                                                                                        size: order.item?.size || '',
                                                                                        specification: (specs as any)['Specification'] || '',
                                                                                        quality: '',
                                                                                        quantity: String(order.quantity || ''),
                                                                                        expectedDeliveryDate: (specs as any)['Expected Delivery'] || '',
                                                                                        pincode,
                                                                                        city: '',
                                                                                        state: '',
                                                                                        country: 'India',
                                                                                        incoterms: '',
                                                                                        shippingAddress: order.shippingAddress || '',
                                                                                        notes: order.notes || '',
                                                                                        sellerBidRunningTime: (specs as any)['Seller Bid Running Time (days)'] || (specs as any)['Bid Running Time (days)'] || '',
                                                                                        shippingBidRunningTime: (specs as any)['Shipping Bid Running Time (days)'] || '',
                                                                                    });
                                                                                    setIsPlaceBidDialogOpen(true);
                                                                                    setOpenDropdowns(prev => ({ ...prev, [order.id]: false }));
                                                                                }}
                                                                            >
                                                                                <Copy className="mr-2 h-4 w-4" />
                                                                                Duplicate
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem
                                                                                onClick={() => {
                                                                                    const specs = order.item?.specifications || {};
                                                                                    setBidForm({
                                                                                        productName: order.item?.name || '',
                                                                                        hsnCode: (specs as any)['HSN Code'] || '',
                                                                                        size: order.item?.size || '',
                                                                                        specification: (specs as any)['Specification'] || '',
                                                                                        quality: '',
                                                                                        quantity: String(order.quantity || ''),
                                                                                        expectedDeliveryDate: (specs as any)['Expected Delivery'] || '',
                                                                                        pincode,
                                                                                        city: '',
                                                                                        state: '',
                                                                                        country: 'India',
                                                                                        incoterms: '',
                                                                                        shippingAddress: order.shippingAddress || '',
                                                                                        notes: order.notes || '',
                                                                                        sellerBidRunningTime: (specs as any)['Seller Bid Running Time (days)'] || (specs as any)['Bid Running Time (days)'] || '',
                                                                                        shippingBidRunningTime: (specs as any)['Shipping Bid Running Time (days)'] || '',
                                                                                    });
                                                                                    setIsPlaceBidDialogOpen(true);
                                                                                    setOpenDropdowns(prev => ({ ...prev, [order.id]: false }));
                                                                                }}
                                                                            >
                                                                                <Edit className="mr-2 h-4 w-4" />
                                                                                Modify
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </div>
                                                            </div>
                                                        );
                                                    }))}
                                            </div>
                                            {filteredAndSortedMyBids.length > 10 && (
                                                <div className="flex justify-center pt-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-xs"
                                                        onClick={() => setMyBidsShowAll(!myBidsShowAll)}
                                                    >
                                                        {myBidsShowAll ? (
                                                            <>
                                                                <ChevronUp className="mr-1 h-3 w-3" />
                                                                Show less
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ChevronDown className="mr-1 h-3 w-3" />
                                                                Show {filteredAndSortedMyBids.length - 10} more
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Items Grid - only visible when a search term is entered */}
                                {itemSearchQuery ? (
                                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                                        {filteredItems.map((item) => (
                                            <CardContainer key={item.id} className="inter-var w-full">
                                                <CardBody className="bg-white dark:bg-gray-950 relative group/card hover:shadow-lg dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] border-gray-200 dark:border-white/[0.2] w-full h-auto rounded-xl p-6 border shadow-sm">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <CardItem
                                                            translateZ="50"
                                                            className="text-xl font-bold text-gray-900 dark:text-white"
                                                        >
                                                            {item.name}
                                                        </CardItem>
                                                        {item.category && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                {item.category}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <CardItem
                                                        as="p"
                                                        translateZ="60"
                                                        className="text-gray-600 dark:text-gray-300 text-sm max-w-sm mt-2 line-clamp-2"
                                                    >
                                                        {item.description}
                                                    </CardItem>
                                                    <CardItem translateZ="100" className="w-full mt-4">
                                                        <div className="flex items-center justify-center w-full h-40 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl group-hover/card:shadow-xl">
                                                            <Package className="h-16 w-16 text-purple-400" />
                                                        </div>
                                                    </CardItem>
                                                    <div className="flex justify-between items-center mt-8">
                                                        <CardItem
                                                            translateZ={20}
                                                            className="px-4 py-2 rounded-xl text-xs font-normal"
                                                        >
                                                            <span className="text-2xl font-bold text-purple-600">${item.price}</span>
                                                            <span className="text-gray-500 ml-1">/ {item.size}</span>
                                                        </CardItem>
                                                        <CardItem
                                                            translateZ={20}
                                                            as="button"
                                                            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors"
                                                            onClick={() => {
                                                                setSelectedItem(item);
                                                                setIsItemDetailsDialogOpen(true);
                                                            }}
                                                        >
                                                            View Details
                                                        </CardItem>
                                                    </div>
                                                </CardBody>
                                            </CardContainer>
                                        ))}

                                        {filteredItems.length === 0 && (
                                            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                                                <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
                                                <h3 className="font-semibold text-lg">No items found</h3>
                                                <p className="text-muted-foreground text-sm mt-1">
                                                    Try a different search term or category filter
                                                </p>
                                                <Button
                                                    variant="link"
                                                    onClick={() => {
                                                        setItemSearchQuery('');
                                                        setItemCategoryFilter('all');
                                                    }}
                                                >
                                                    Clear filters
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        )}

                        {/* My Orders Tab */}
                        {currentTab === 'orders' && (
                            <div className="space-y-4">
                                <div className="grid gap-4">
                                    {orders.map((order) => (
                                        <Card key={order.id} className="border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-900">
                                            <CardHeader>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                                            <Package className="h-6 w-6 text-purple-600" />
                                                        </div>
                                                        <div>
                                                            <CardTitle>{order.item?.name || 'Unknown Item'}</CardTitle>
                                                            <CardDescription>Order #{order.id.slice(0, 8)} • {new Date(order.createdAt).toLocaleDateString()}</CardDescription>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className={getStatusColor(order.status)}>{order.status}</Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Quantity</Label>
                                                        <p className="font-semibold">{order.quantity} units</p>
                                                    </div>
                                                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Total Price</Label>
                                                        <p className="font-semibold text-purple-600">${(order.totalPrice || 0).toFixed(2)}</p>
                                                    </div>
                                                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Status</Label>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold capitalize">{order.status}</p>
                                                            {order.status === 'pending' && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                                                                    className="h-6 text-xs"
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            )}
                                                            {order.status === 'accepted' && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                                                                    className="h-6 text-xs"
                                                                >
                                                                    Mark Complete
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Updated</Label>
                                                        <p className="font-semibold">{new Date(order.updatedAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Seller Bids Tab */}
                        {currentTab === 'bids' && (
                            <div className="space-y-4">
                                <div className="grid gap-4">
                                    {bids.map((bid) => (
                                        <Card key={bid.id} className="border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-900 overflow-hidden relative">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-blue-500" />
                                            <CardHeader>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <CardTitle className="text-gray-900 dark:text-gray-100">Bid from Vendor #{bid.id.slice(0, 6).toUpperCase()}</CardTitle>
                                                        <CardDescription>
                                                            Order #{bid.orderId.slice(0, 8)} • {new Date(bid.createdAt).toLocaleDateString()}
                                                        </CardDescription>
                                                    </div>
                                                    <Badge variant="outline" className={getStatusColor(bid.status)}>{bid.status}</Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                                        <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bid Amount</Label>
                                                        <p className="text-xl font-bold text-purple-600">${bid.bidAmount.toFixed(2)}</p>
                                                    </div>
                                                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Estimated Delivery</Label>
                                                        <p className="font-medium">{new Date(bid.estimatedDelivery).toLocaleDateString()}</p>
                                                    </div>
                                                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Status</Label>
                                                        <p className="font-medium capitalize">{bid.status}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                            {bid.status === 'pending' && (
                                                <CardFooter className="gap-3 bg-gray-50/50 dark:bg-gray-900/50 p-4">
                                                    <Button
                                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20"
                                                        onClick={() => handleAcceptBid(bid.id)}
                                                    >
                                                        <Check className="mr-2 h-4 w-4" />
                                                        Accept
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        className="flex-1 shadow-lg shadow-red-500/20"
                                                        onClick={() => handleRejectBid(bid.id)}
                                                    >
                                                        <X className="mr-2 h-4 w-4" />
                                                        Reject
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1"
                                                        onClick={() => handleDeleteBid(bid.id)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </Button>
                                                </CardFooter>
                                            )}
                                            {bid.status !== 'pending' && (
                                                <CardFooter className="gap-3 bg-gray-50/50 dark:bg-gray-900/50 p-4">
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1"
                                                        onClick={() => handleDeleteBid(bid.id)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete Bid
                                                    </Button>
                                                </CardFooter>
                                            )}
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Live Bids Section - Always visible at the end */}
                    {bids.filter(b => b.status === 'pending').length > 0 && (
                        <div className="space-y-6 mt-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Live Bids</h2>
                                    <Badge variant="secondary" className="ml-2">{filteredAndSortedLiveBids.length} active</Badge>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={resetLiveBidsFilters}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <X className="mr-1 h-4 w-4" />
                                    Clear Filters
                                </Button>
                            </div>

                            {/* Enhanced Search and Filter Controls for Live Bids */}
                            <div className="space-y-4">
                                {/* Search Bar */}
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <Input
                                        type="text"
                                        placeholder="Search by product name, order ID, or seller ID..."
                                        className="pl-10 h-10 text-sm"
                                        value={liveBidsSearchQuery}
                                        onChange={(e) => setLiveBidsSearchQuery(e.target.value)}
                                    />
                                    {liveBidsSearchQuery && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="absolute inset-y-0 right-0 pr-3 h-full"
                                            onClick={() => setLiveBidsSearchQuery('')}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                {/* Sort Controls */}
                                <div className="flex flex-wrap gap-4 items-center">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Sort by:</span>
                                        <Select value={liveBidsSortBy} onValueChange={(value: any) => setLiveBidsSortBy(value)}>
                                            <SelectTrigger className="w-[140px] h-8">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ending">Ending Time</SelectItem>
                                                <SelectItem value="date">Date Created</SelectItem>
                                                <SelectItem value="amount">Bid Amount</SelectItem>
                                                <SelectItem value="delivery">Delivery Date</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setLiveBidsSortDirection(liveBidsSortDirection === 'asc' ? 'desc' : 'asc')}
                                            className="p-2 h-8"
                                        >
                                            {liveBidsSortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4">
                                {filteredAndSortedLiveBids.length === 0 ? (
                                    <Card className="p-8 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                                        <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse mx-auto mb-4" />
                                        <p className="text-muted-foreground">
                                            {bids.filter(b => b.status === 'pending').length === 0 ? 'No live bids available' : 'No bids match your search'}
                                        </p>
                                        {liveBidsSearchQuery && (
                                            <Button
                                                variant="outline"
                                                className="mt-4"
                                                onClick={resetLiveBidsFilters}
                                            >
                                                Clear Filters
                                            </Button>
                                        )}
                                    </Card>
                                ) : (
                                    (liveBidsShowAll ? filteredAndSortedLiveBids : filteredAndSortedLiveBids.slice(0, 5)).map((bid) => {
                                        const order = orders.find(o => o.id === bid.orderId);
                                        const timeLeftLabel = getBidTimeLeftLabel(order);
                                        const isExpired = timeLeftLabel === 'Expired';

                                        // Check if order is domestic or international
                                        const destinationCountry = order?.item?.specifications?.['Destination Country'] || 'India';
                                        const isInternational = destinationCountry !== 'India';

                                        // Find the lowest shipping bid for this order
                                        const orderShippingBids = shippingBids.filter(sb => sb.orderId === bid.orderId && sb.status === 'pending');
                                        const lowestShippingBid = orderShippingBids.length > 0
                                            ? orderShippingBids.reduce((lowest, sb) => sb.bidAmount < lowest.bidAmount ? sb : lowest)
                                            : null;
                                        const totalCost = bid.bidAmount + (lowestShippingBid?.bidAmount || 0);

                                        // Calculate bid comparison - find all bids for this order
                                        const allOrderBids = bids.filter(b => b.orderId === bid.orderId && b.status === 'pending');
                                        const highestBid = allOrderBids.length > 0 ? Math.max(...allOrderBids.map(b => b.bidAmount)) : bid.bidAmount;
                                        const percentLowerThanHighest = highestBid > 0 && bid.bidAmount < highestBid
                                            ? ((highestBid - bid.bidAmount) / highestBid * 100).toFixed(1)
                                            : null;

                                        return (
                                            <Card key={bid.id} className="border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-900 overflow-hidden relative">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-blue-500" />
                                                <CardHeader>
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <CardTitle className="text-gray-900 dark:text-gray-100">
                                                                {order?.item?.name || `Order #${bid.orderId.slice(0, 8)}`}
                                                            </CardTitle>
                                                            <CardDescription>
                                                                Enquiry Number #{bid.sellerId?.slice(0, 6).toUpperCase() || bid.id.slice(0, 6).toUpperCase()} • {new Date(bid.createdAt).toLocaleDateString()}
                                                            </CardDescription>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                                                                <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Live</Badge>
                                                            </div>
                                                            <div className={`flex items-center gap-2 mt-1 px-3 py-1.5 rounded-full border shadow-sm backdrop-blur-md ${isExpired ? 'bg-red-500/10 border-red-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
                                                                <ClockTimer
                                                                    endTime={order ? calculateBidEndTime(order) : new Date()}
                                                                    size={18}
                                                                    className="font-extrabold text-sm tracking-wide"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-3">
                                                    <div className={`grid ${isInternational ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2'} gap-4`}>
                                                        <div className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-900/20">
                                                            <Label className="text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wider">Seller Bid</Label>
                                                            <p className="text-xl font-bold text-purple-600">${bid.bidAmount.toFixed(2)}</p>
                                                            <p className="text-[10px] text-purple-500 dark:text-purple-400 mt-0.5">exclusive GST</p>
                                                        </div>
                                                        {isInternational && (
                                                            <>
                                                                <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/20">
                                                                    <Label className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider">Shipping Cost</Label>
                                                                    <p className="text-xl font-bold text-blue-600">
                                                                        {lowestShippingBid ? `$${lowestShippingBid.bidAmount.toFixed(2)}` : 'No bid yet'}
                                                                    </p>
                                                                    {orderShippingBids.length > 1 && (
                                                                        <p className="text-xs text-muted-foreground mt-1">{orderShippingBids.length} shipping bids</p>
                                                                    )}
                                                                </div>
                                                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-900/20">
                                                                    <Label className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Cost</Label>
                                                                    <p className="text-2xl font-bold text-emerald-600">${totalCost.toFixed(2)}</p>
                                                                </div>
                                                            </>
                                                        )}
                                                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Quantity</Label>
                                                            <p className="font-medium">{order?.quantity || 'N/A'} units</p>
                                                        </div>
                                                    </div>
                                                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Estimated Delivery</Label>
                                                        <p className="font-medium">{new Date(bid.estimatedDelivery).toLocaleDateString()}</p>
                                                    </div>

                                                    {/* Pickup Address */}
                                                    {bid.pickupAddress && (
                                                        <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-100 dark:border-orange-900/20">
                                                            <Label className="text-xs text-orange-600 dark:text-orange-400 uppercase tracking-wider">Pickup Address</Label>
                                                            <p className="font-medium text-sm mt-1">{bid.pickupAddress}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">Seller's goods location for shipping provider pickup</p>
                                                        </div>
                                                    )}

                                                    {/* Bid Comparison */}
                                                    {percentLowerThanHighest && allOrderBids.length > 1 && (
                                                        <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border-2 border-green-200 dark:border-green-800 shadow-sm">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full">
                                                                    <TrendingDown className="h-4 w-4 text-white" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <Label className="text-xs text-green-700 dark:text-green-300 uppercase tracking-wider font-bold">Best Value</Label>
                                                                    <p className="text-sm font-bold text-green-700 dark:text-green-300 mt-0.5">
                                                                        This bid is {percentLowerThanHighest}% lower than the highest bid
                                                                    </p>
                                                                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                                                        Competing with {allOrderBids.length - 1} other seller{allOrderBids.length - 1 > 1 ? 's' : ''}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Display shipping details including Incoterms */}
                                                    {order?.item?.specifications && (
                                                        <>
                                                            {order.item.specifications['Destination Country'] && order.item.specifications['Destination Country'] !== 'India' && order.item.specifications['Incoterms'] && (
                                                                <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/20">
                                                                    <Label className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider">International Shipping</Label>
                                                                    <div className="mt-1 space-y-1">
                                                                        <div className="flex justify-between text-sm">
                                                                            <span className="text-muted-foreground">Destination:</span>
                                                                            <span className="font-medium">{order.item.specifications['Destination Country']}</span>
                                                                        </div>
                                                                        <div className="flex justify-between text-sm">
                                                                            <span className="text-muted-foreground">Incoterms:</span>
                                                                            <span className="font-medium text-amber-700 dark:text-amber-300">{order.item.specifications['Incoterms']}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {order.item.specifications['Destination Country'] && order.item.specifications['Destination Country'] === 'India' && (
                                                                <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/20">
                                                                    <Label className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider">Domestic Shipping</Label>
                                                                    <div className="mt-1">
                                                                        <div className="flex justify-between text-sm">
                                                                            <span className="text-muted-foreground">Destination:</span>
                                                                            <span className="font-medium">India (Domestic)</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </CardContent>
                                                <CardFooter className="gap-3 bg-gray-50/50 dark:bg-gray-900/50 p-4">
                                                    <Button
                                                        className="w-32 rounded-lg bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20"
                                                        onClick={() => handleAcceptBid(bid.id)}
                                                    >
                                                        <Check className="mr-2 h-4 w-4" />
                                                        Accept
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        className="w-32 rounded-lg shadow-lg shadow-red-500/20"
                                                        onClick={() => handleRejectBid(bid.id)}
                                                    >
                                                        <X className="mr-2 h-4 w-4" />
                                                        Reject
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="w-32 rounded-lg"
                                                        onClick={() => handleDeleteBid(bid.id)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                        );
                                    }))}

                                {/* Load More button for Live Bids */}
                                {filteredAndSortedLiveBids.length > 5 && (
                                    <div className="flex justify-center">
                                        <Button
                                            variant="outline"
                                            className="w-full max-w-xs border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                            onClick={() => setLiveBidsShowAll(!liveBidsShowAll)}
                                        >
                                            {liveBidsShowAll ? (
                                                <>
                                                    <ChevronUp className="mr-2 h-4 w-4" />
                                                    Show Less
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="mr-2 h-4 w-4" />
                                                    Show {filteredAndSortedLiveBids.length - 5} More
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Place Order Dialog */}
                    <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Place Order</DialogTitle>
                                <DialogDescription>Order details for {selectedItem?.name}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label>Quantity</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={orderForm.quantity}
                                        onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Shipping Address</Label>
                                    <Textarea
                                        value={orderForm.shippingAddress}
                                        onChange={(e) => setOrderForm({ ...orderForm, shippingAddress: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <Label>Notes (Optional)</Label>
                                    <Textarea
                                        value={orderForm.notes}
                                        onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                                        rows={2}
                                    />
                                </div>
                                {selectedItem && orderForm.quantity && (
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <Label>Total Price</Label>
                                        <p className="text-2xl font-bold text-purple-600">
                                            ${(selectedItem.price * parseInt(orderForm.quantity)).toFixed(2)}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsOrderDialogOpen(false)}
                                    disabled={placingOrder}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handlePlaceOrder}
                                    disabled={!orderForm.quantity || !orderForm.shippingAddress || placingOrder}
                                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                                >
                                    {placingOrder ? "Placing Order..." : "Place Order"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Item Details Dialog */}
                    <Dialog open={isItemDetailsDialogOpen} onOpenChange={setIsItemDetailsDialogOpen}>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{selectedItem?.name}</DialogTitle>
                                <DialogDescription>{selectedItem?.description}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg">
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                        <Package className="h-32 w-32" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-muted-foreground">Price</Label>
                                        <p className="text-2xl font-bold text-purple-600">${selectedItem?.price}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Size</Label>
                                        <p className="text-lg font-medium">{selectedItem?.size}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Category</Label>
                                        <p className="text-lg font-medium">{selectedItem?.category}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Condition</Label>
                                        <p className="text-lg font-medium capitalize">{selectedItem?.condition}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Available Stock</Label>
                                        <p className="text-lg font-medium">{selectedItem?.quantity} units</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Listed By</Label>
                                        <p className="text-lg font-medium">Verified Vendor</p>
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <Label className="text-lg font-semibold mb-2 block">Specifications</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {Object.entries(selectedItem?.specifications || {}).map(([key, value]) => (
                                            <div key={key} className="bg-muted p-3 rounded-lg">
                                                <p className="text-sm text-muted-foreground">{key}</p>
                                                <p className="font-medium">{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                                    onClick={() => {
                                        setIsItemDetailsDialogOpen(false);
                                        // Pre-fill bid form with selected item details
                                        setBidForm({
                                            ...bidForm,
                                            productName: selectedItem?.name || '',
                                            size: selectedItem?.size || '',
                                            specification: selectedItem?.specifications?.['Variety/Grade'] || '',
                                            quality: selectedItem?.specifications?.['Quality Grade'] || '',
                                        });
                                        setIsPlaceBidDialogOpen(true);
                                    }}
                                >
                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                    Place Bid Request
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Select from Catalog Dialog */}
                    <Dialog open={isSelectProductDialogOpen} onOpenChange={setIsSelectProductDialogOpen}>
                        <DialogContent className="max-w-4xl max-h-[85vh]">
                            <DialogHeader>
                                <DialogTitle className="text-2xl">Product Catalog</DialogTitle>
                                <DialogDescription>
                                    Search by product name or HSN code to quickly find and add products
                                </DialogDescription>
                            </DialogHeader>

                            {/* Search and Filter */}
                            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name or HSN code (e.g., 0909, Cumin)..."
                                        value={catalogSearchQuery}
                                        onChange={(e) => setCatalogSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                    <SelectTrigger className="w-full sm:w-[200px]">
                                        <SelectValue placeholder="All Categories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        <SelectItem value="Spices">🌶️ Spices</SelectItem>
                                        <SelectItem value="Vegetables">🥬 Vegetables</SelectItem>
                                        <SelectItem value="Pulses">🫘 Pulses</SelectItem>
                                        <SelectItem value="Dry Fruits & Nuts">🥜 Dry Fruits & Nuts</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Category Quick Filters */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                <Badge
                                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                                    className="cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                                    onClick={() => setSelectedCategory('all')}
                                >
                                    All ({ALL_PRODUCTS.length})
                                </Badge>
                                <Badge
                                    variant={selectedCategory === 'Spices' ? 'default' : 'outline'}
                                    className="cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                                    onClick={() => setSelectedCategory('Spices')}
                                >
                                    🌶️ Spices ({PRODUCT_CATALOG.spices.length})
                                </Badge>
                                <Badge
                                    variant={selectedCategory === 'Vegetables' ? 'default' : 'outline'}
                                    className="cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                                    onClick={() => setSelectedCategory('Vegetables')}
                                >
                                    🥬 Vegetables ({PRODUCT_CATALOG.vegetables.length})
                                </Badge>
                                <Badge
                                    variant={selectedCategory === 'Pulses' ? 'default' : 'outline'}
                                    className="cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                                    onClick={() => setSelectedCategory('Pulses')}
                                >
                                    🫘 Pulses ({PRODUCT_CATALOG.pulses.length})
                                </Badge>
                                <Badge
                                    variant={selectedCategory === 'Dry Fruits & Nuts' ? 'default' : 'outline'}
                                    className="cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                                    onClick={() => setSelectedCategory('Dry Fruits & Nuts')}
                                >
                                    🥜 Dry Fruits ({PRODUCT_CATALOG.dry_fruits_and_nuts.length})
                                </Badge>
                            </div>

                            {/* Results Count */}
                            <p className="text-sm text-muted-foreground mb-2">
                                {filteredCatalogProducts.length} products found
                                {catalogSearchQuery && ` for "${catalogSearchQuery}"`}
                            </p>

                            {/* Product Grid */}
                            <ScrollArea className="h-[400px] pr-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {filteredCatalogProducts.map((product, index) => (
                                        <Card
                                            key={`${product.name}-${index}`}
                                            className="hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200 group"
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-sm group-hover:text-purple-600 transition-colors line-clamp-2">
                                                        {product.name}
                                                    </h4>
                                                    <div className="flex flex-wrap items-center gap-1 mt-2">
                                                        <Badge variant="secondary" className="text-xs">
                                                            HSN: {product.hsn}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                                                            {product.variety}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {product.category}
                                                    </p>
                                                </div>
                                                <div className="mt-3">
                                                    <Button
                                                        size="sm"
                                                        className="w-full text-xs bg-purple-600 hover:bg-purple-700"
                                                        onClick={() => selectCatalogProductForBid(product)}
                                                    >
                                                        <Send className="h-3 w-3 mr-1" />
                                                        Place Bid
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                {filteredCatalogProducts.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                        <h3 className="font-semibold text-lg">No products found</h3>
                                        <p className="text-muted-foreground text-sm mt-1">
                                            Try a different search term or category
                                        </p>
                                        <Button
                                            variant="link"
                                            onClick={() => {
                                                setCatalogSearchQuery('');
                                                setSelectedCategory('all');
                                            }}
                                        >
                                            Clear filters
                                        </Button>
                                    </div>
                                )}
                            </ScrollArea>

                            <DialogFooter className="mt-4">
                                <Button variant="outline" onClick={() => setIsSelectProductDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setIsSelectProductDialogOpen(false);
                                        setIsPlaceBidDialogOpen(true);
                                    }}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Enter Custom Product
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Add Product Dialog */}
                    <Dialog open={isAddProductDialogOpen} onOpenChange={(open) => {
                        setIsAddProductDialogOpen(open);
                        if (!open) {
                            // Reset form when dialog closes
                            setProductForm({
                                name: '',
                                description: '',
                                price: '',
                                size: '',
                                category: '',
                                condition: 'new',
                                quality: '',
                                quantity: '',
                                specifications: {},
                            });
                            setSpecKey('');
                            setSpecValue('');
                        }
                    }}>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Add New Product</DialogTitle>
                                <DialogDescription>
                                    {productForm.name ? `Adding: ${productForm.name}` : 'Create a new product to sell in the marketplace'}
                                </DialogDescription>
                            </DialogHeader>

                            {/* HSN Badge if selected from catalog */}
                            {productForm.specifications['HSN Code'] && (
                                <div className="flex flex-wrap items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                                        HSN: {productForm.specifications['HSN Code']}
                                    </Badge>
                                    {productForm.specifications['Variety/Grade'] && (
                                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                                            {productForm.specifications['Variety/Grade']}
                                        </Badge>
                                    )}
                                    <span className="text-sm text-purple-600 dark:text-purple-400">
                                        Selected from catalog
                                    </span>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="productName">Product Name</Label>
                                        <Input
                                            id="productName"
                                            value={productForm.name}
                                            onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                                            placeholder="e.g., Fresh Organic Tomatoes"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="productPrice">Price ($)</Label>
                                        <Input
                                            id="productPrice"
                                            type="number"
                                            step="0.01"
                                            value={productForm.price}
                                            onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="productDescription">Description</Label>
                                    <Textarea
                                        id="productDescription"
                                        value={productForm.description}
                                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                                        placeholder="Describe your product..."
                                        rows={3}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="productSize">Size</Label>
                                        <Input
                                            id="productSize"
                                            value={productForm.size}
                                            onChange={(e) => setProductForm({ ...productForm, size: e.target.value })}
                                            placeholder="e.g., 1kg, 500ml"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="productCategory">Category</Label>
                                        <Input
                                            id="productCategory"
                                            value={productForm.category}
                                            onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                                            placeholder="e.g., Vegetables, Electronics"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="productCondition">Condition</Label>
                                        <Select
                                            value={productForm.condition}
                                            onValueChange={(value: 'new' | 'used' | 'refurbished') => setProductForm({ ...productForm, condition: value })}
                                        >
                                            <SelectTrigger id="productCondition">
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
                                        <Label htmlFor="productQuantity">Quantity</Label>
                                        <Input
                                            id="productQuantity"
                                            type="number"
                                            value={productForm.quantity}
                                            onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                {/* Quality Grade Selection */}
                                <div>
                                    <Label htmlFor="productQuality">Quality Grade *</Label>
                                    <Select
                                        value={productForm.quality || undefined}
                                        onValueChange={(value) => setProductForm({ ...productForm, quality: value })}
                                    >
                                        <SelectTrigger id="productQuality" className="mt-1">
                                            <SelectValue placeholder="Select quality grade..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {QUALITY_GRADES.map((grade) => (
                                                <SelectItem key={grade.value} value={grade.value}>
                                                    <span className="font-medium">{grade.label}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {productForm.quality && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {QUALITY_GRADES.find(g => g.value === productForm.quality)?.description}
                                        </p>
                                    )}
                                </div>
                                <Separator />
                                <div>
                                    <Label>Specifications (Optional)</Label>
                                    <div className="space-y-2 mt-2">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Key (e.g., Origin)"
                                                value={specKey}
                                                onChange={(e) => setSpecKey(e.target.value)}
                                            />
                                            <Input
                                                placeholder="Value (e.g., India)"
                                                value={specValue}
                                                onChange={(e) => setSpecValue(e.target.value)}
                                            />
                                            <Button type="button" onClick={addSpecification} variant="outline">
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        {Object.entries(productForm.specifications).length > 0 && (
                                            <div className="space-y-1">
                                                {Object.entries(productForm.specifications).map(([key, value]) => (
                                                    <div key={key} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                                        <span className="text-sm"><strong>{key}:</strong> {value}</span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeSpecification(key)}
                                                            className="h-6 w-6"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddProductDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAddProduct}
                                    className="bg-gradient-to-r from-purple-600 to-blue-600"
                                    disabled={addingProduct}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    {addingProduct ? "Adding..." : "Add Product"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Place Bid Request Dialog */}
                    <Dialog open={isPlaceBidDialogOpen} onOpenChange={(open) => {
                        setIsPlaceBidDialogOpen(open);
                        if (!open) {
                            setBidForm({
                                productName: '',
                                hsnCode: '',
                                size: '',
                                specification: '',
                                quality: '',
                                quantity: '',
                                expectedDeliveryDate: '',
                                pincode: '',
                                city: '',
                                state: '',
                                country: 'India',
                                incoterms: '',
                                shippingAddress: '',
                                notes: '',
                                sellerBidRunningTime: '',
                                shippingBidRunningTime: '',
                            });
                            setSelectedCatalogProduct(null);
                        }
                    }}>
                        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-2xl">Place Bid Request</DialogTitle>
                                <DialogDescription>
                                    Create a bid request for sellers to submit their offers. Fill in the product details below.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                                {/* Product Selection */}
                                <div className="space-y-2">
                                    <Label htmlFor="bidProductName">Product Name *</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="bidProductName"
                                            value={bidForm.productName}
                                            onChange={(e) => setBidForm({ ...bidForm, productName: e.target.value })}
                                            placeholder="Enter product name or select from catalog"
                                            className="flex-1"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setIsPlaceBidDialogOpen(false);
                                                setIsSelectProductDialogOpen(true);
                                            }}
                                        >
                                            <Search className="h-4 w-4 mr-2" />
                                            Catalog
                                        </Button>
                                    </div>
                                </div>

                                {/* HSN Code and Size */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="bidHsnCode">HSN Code</Label>
                                        <Input
                                            id="bidHsnCode"
                                            value={bidForm.hsnCode}
                                            onChange={(e) => setBidForm({ ...bidForm, hsnCode: e.target.value })}
                                            placeholder="e.g., 0909"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="bidSize">Size / Unit *</Label>
                                        <Select
                                            value={bidForm.size}
                                            onValueChange={(value) => setBidForm({ ...bidForm, size: value })}
                                        >
                                            <SelectTrigger id="bidSize">
                                                <SelectValue placeholder="Select size/unit" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {SIZE_OPTIONS.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Specification and Quality */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="bidSpecification">Specification / Variety</Label>
                                        <Input
                                            id="bidSpecification"
                                            value={bidForm.specification}
                                            onChange={(e) => setBidForm({ ...bidForm, specification: e.target.value })}
                                            placeholder="e.g., Singapore Quality, Bold"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="bidQuality">Quality Grade *</Label>
                                        <Select
                                            value={bidForm.quality}
                                            onValueChange={(value) => setBidForm({ ...bidForm, quality: value })}
                                        >
                                            <SelectTrigger id="bidQuality">
                                                <SelectValue placeholder="Select quality" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {QUALITY_GRADES.map((grade) => (
                                                    <SelectItem key={grade.value} value={grade.value}>
                                                        {grade.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Quantity and Expected Date */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="bidQuantity">Quantity *</Label>
                                        <Input
                                            id="bidQuantity"
                                            type="number"
                                            min="1"
                                            value={bidForm.quantity}
                                            onChange={(e) => setBidForm({ ...bidForm, quantity: e.target.value })}
                                            placeholder="Enter quantity"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="bidExpectedDate">Expected Delivery Date *</Label>
                                        <Input
                                            id="bidExpectedDate"
                                            type="date"
                                            value={bidForm.expectedDeliveryDate}
                                            onChange={(e) => setBidForm({ ...bidForm, expectedDeliveryDate: e.target.value })}
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                </div>

                                {/* Bid Running Time - Single Input (Shipping auto-set to 1 day) */}
                                <div className="space-y-4">
                                    <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                                        <h3 className="font-semibold text-purple-700 dark:text-purple-300 mb-3 flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            Bidding Timeline
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Set how long sellers can bid on your order. (Shipping provider bidding will automatically be set to 1 day)
                                        </p>

                                        <div>
                                            <Label htmlFor="sellerBidRunningTime" className="text-purple-700 dark:text-purple-300 font-semibold">
                                                Seller Bid Running Time (days) *
                                            </Label>
                                            <Input
                                                id="sellerBidRunningTime"
                                                type="number"
                                                min="1"
                                                value={bidForm.sellerBidRunningTime}
                                                onChange={(e) => {
                                                    setBidForm({
                                                        ...bidForm,
                                                        sellerBidRunningTime: e.target.value,
                                                        shippingBidRunningTime: '1' // Auto-set to 1 day
                                                    });
                                                }}
                                                placeholder="e.g., 3"
                                                className="mt-1"
                                            />
                                            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                                Sellers will have this many days to place their bids
                                            </p>
                                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                                ℹ️ Shipping providers will automatically get 1 day to bid after a seller is selected
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Location Details */}
                                <div className="space-y-4">
                                    {/* Country Selection */}
                                    <div>
                                        <Label htmlFor="bidCountry">Destination Country *</Label>
                                        <Select
                                            value={bidForm.country}
                                            onValueChange={(value) => setBidForm({ ...bidForm, country: value, incoterms: value !== 'India' ? bidForm.incoterms : '' })}
                                        >
                                            <SelectTrigger id="bidCountry">
                                                <SelectValue placeholder="Select country" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <ScrollArea className="h-[200px]">
                                                    {COUNTRIES.map((country) => (
                                                        <SelectItem key={country} value={country}>{country}</SelectItem>
                                                    ))}
                                                </ScrollArea>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Incoterms - Show only if country is not India */}
                                    {bidForm.country && bidForm.country !== 'India' && (
                                        <div>
                                            <Label htmlFor="bidIncoterms">Incoterms *</Label>
                                            <Select
                                                value={bidForm.incoterms}
                                                onValueChange={(value) => setBidForm({ ...bidForm, incoterms: value })}
                                            >
                                                <SelectTrigger id="bidIncoterms">
                                                    <SelectValue placeholder="Select Incoterms" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {INCOTERMS.map((incoterm) => (
                                                        <SelectItem key={incoterm.code} value={incoterm.code}>
                                                            {incoterm.code} - {incoterm.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* Indian location details - Show only if country is India */}
                                    {bidForm.country === 'India' && (
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <Label htmlFor="bidPincode">Pincode *</Label>
                                                <Input
                                                    id="bidPincode"
                                                    value={bidForm.pincode}
                                                    onChange={(e) => setBidForm({ ...bidForm, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                                    placeholder="6-digit pincode"
                                                    maxLength={6}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="bidCity">City *</Label>
                                                <Input
                                                    id="bidCity"
                                                    value={bidForm.city}
                                                    onChange={(e) => setBidForm({ ...bidForm, city: e.target.value })}
                                                    placeholder="Enter city"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="bidState">State *</Label>
                                                <Select
                                                    value={bidForm.state}
                                                    onValueChange={(value) => setBidForm({ ...bidForm, state: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select state" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <ScrollArea className="h-[200px]">
                                                            {INDIAN_STATES.map((state) => (
                                                                <SelectItem key={state} value={state}>{state}</SelectItem>
                                                            ))}
                                                        </ScrollArea>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    )}

                                    {/* International location details - Show only if country is not India */}
                                    {bidForm.country && bidForm.country !== 'India' && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label htmlFor="bidCity">City *</Label>
                                                <Input
                                                    id="bidCity"
                                                    value={bidForm.city}
                                                    onChange={(e) => setBidForm({ ...bidForm, city: e.target.value })}
                                                    placeholder="Enter city"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="bidState">State/Province</Label>
                                                <Input
                                                    id="bidState"
                                                    value={bidForm.state}
                                                    onChange={(e) => setBidForm({ ...bidForm, state: e.target.value })}
                                                    placeholder="Enter state/province"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Shipping Address */}
                                <div>
                                    <Label htmlFor="bidShippingAddress">Complete Shipping Address *</Label>
                                    <Textarea
                                        id="bidShippingAddress"
                                        value={bidForm.shippingAddress}
                                        onChange={(e) => setBidForm({ ...bidForm, shippingAddress: e.target.value })}
                                        placeholder="Enter street address, landmark, etc."
                                        rows={2}
                                    />
                                </div>

                                {/* Additional Notes */}
                                <div>
                                    <Label htmlFor="bidNotes">Additional Notes (Optional)</Label>
                                    <Textarea
                                        id="bidNotes"
                                        value={bidForm.notes}
                                        onChange={(e) => setBidForm({ ...bidForm, notes: e.target.value })}
                                        placeholder="Any special requirements or notes for sellers..."
                                        rows={2}
                                    />
                                </div>

                                {/* Summary Card */}
                                {bidForm.productName && bidForm.quantity && (
                                    <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                                        <CardContent className="p-4">
                                            <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">Bid Request Summary</h4>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground">Product:</span>
                                                    <p className="font-medium">{bidForm.productName}</p>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Quantity:</span>
                                                    <p className="font-medium">{bidForm.quantity} {bidForm.size || 'units'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Destination:</span>
                                                    <p className="font-medium">{bidForm.country}</p>
                                                </div>
                                                {bidForm.country !== 'India' && bidForm.incoterms && (
                                                    <div>
                                                        <span className="text-muted-foreground">Incoterms:</span>
                                                        <p className="font-medium text-amber-600">{bidForm.incoterms} - {INCOTERMS.find(i => i.code === bidForm.incoterms)?.name}</p>
                                                    </div>
                                                )}
                                                {bidForm.quality && (
                                                    <div>
                                                        <span className="text-muted-foreground">Quality:</span>
                                                        <p className="font-medium">{QUALITY_GRADES.find(g => g.value === bidForm.quality)?.label}</p>
                                                    </div>
                                                )}
                                                {bidForm.expectedDeliveryDate && (
                                                    <div>
                                                        <span className="text-muted-foreground">Expected By:</span>
                                                        <p className="font-medium">{new Date(bidForm.expectedDeliveryDate).toLocaleDateString()}</p>
                                                    </div>
                                                )}
                                                {bidForm.sellerBidRunningTime && (
                                                    <div>
                                                        <span className="text-muted-foreground">Seller Bid Time:</span>
                                                        <p className="font-medium text-purple-600">{bidForm.sellerBidRunningTime} days</p>
                                                    </div>
                                                )}
                                                {bidForm.shippingBidRunningTime && (
                                                    <div>
                                                        <span className="text-muted-foreground">Shipping Bid Time:</span>
                                                        <p className="font-medium text-blue-600">{bidForm.shippingBidRunningTime} days</p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            <DialogFooter className="mt-4">
                                <Button variant="outline" onClick={() => setIsPlaceBidDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handlePlaceBidRequest}
                                    disabled={
                                        placingBidRequest ||
                                        !bidForm.productName ||
                                        !bidForm.quantity ||
                                        !bidForm.shippingAddress ||
                                        !bidForm.expectedDeliveryDate ||
                                        !bidForm.sellerBidRunningTime ||
                                        !bidForm.country ||
                                        !bidForm.city ||
                                        (bidForm.country === 'India' && (!bidForm.pincode || !bidForm.state || bidForm.pincode.length !== 6)) ||
                                        (bidForm.country !== 'India' && !bidForm.incoterms)
                                    }
                                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                                >
                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                    {placingBidRequest ? "Placing Request..." : "Place Bid Request"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Add to List Dialog */}
                    <Dialog open={isAddToListDialogOpen} onOpenChange={(open) => {
                        setIsAddToListDialogOpen(open);
                        if (!open) {
                            setAddToListForm({
                                productName: '',
                                hsnCode: '',
                                size: '',
                                specification: '',
                                quality: '',
                                quantity: '',
                                expectedDeliveryDate: '',
                                pincode: '',
                                city: '',
                                state: '',
                                country: 'India',
                                incoterms: '',
                                shippingAddress: '',
                                notes: '',
                            });
                            setSelectedProductForList(null);
                        }
                    }}>
                        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-2xl">Add New Item</DialogTitle>
                                <DialogDescription>
                                    Add a new item to the catalog. It will appear in the items list below the search bar.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                                {/* Product Selection */}
                                <div>
                                    <Label>Product *</Label>
                                    <div className="flex gap-2 mt-1">
                                        <Input
                                            value={addToListForm.productName}
                                            onChange={(e) => setAddToListForm({ ...addToListForm, productName: e.target.value })}
                                            placeholder="Enter product name or browse catalog"
                                            className="flex-1"
                                        />
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsSelectProductDialogOpen(true)}
                                        >
                                            <Search className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* HSN Code and Specification */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor="listHsnCode">HSN Code</Label>
                                        <Input
                                            id="listHsnCode"
                                            value={addToListForm.hsnCode}
                                            onChange={(e) => setAddToListForm({ ...addToListForm, hsnCode: e.target.value })}
                                            placeholder="e.g., 0909"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="listSpecification">Specification/Variety</Label>
                                        <Input
                                            id="listSpecification"
                                            value={addToListForm.specification}
                                            onChange={(e) => setAddToListForm({ ...addToListForm, specification: e.target.value })}
                                            placeholder="e.g., Singapore Quality"
                                        />
                                    </div>
                                </div>

                                {/* Size, Quality, Quantity */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <Label htmlFor="listSize">Size/Package</Label>
                                        <Select
                                            value={addToListForm.size}
                                            onValueChange={(value) => setAddToListForm({ ...addToListForm, size: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select size" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {SIZE_OPTIONS.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="listQuality">Quality Grade</Label>
                                        <Select
                                            value={addToListForm.quality}
                                            onValueChange={(value) => setAddToListForm({ ...addToListForm, quality: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select quality" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <ScrollArea className="h-[200px]">
                                                    {QUALITY_GRADES.map((grade) => (
                                                        <SelectItem key={grade.value} value={grade.value}>{grade.label}</SelectItem>
                                                    ))}
                                                </ScrollArea>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="listQuantity">Quantity *</Label>
                                        <Input
                                            id="listQuantity"
                                            type="number"
                                            value={addToListForm.quantity}
                                            onChange={(e) => setAddToListForm({ ...addToListForm, quantity: e.target.value })}
                                            placeholder="e.g., 100"
                                            min="1"
                                        />
                                    </div>
                                </div>

                                {/* Expected Delivery Date */}
                                <div>
                                    <Label htmlFor="listExpectedDate">Expected Delivery Date</Label>
                                    <Input
                                        id="listExpectedDate"
                                        type="date"
                                        value={addToListForm.expectedDeliveryDate}
                                        onChange={(e) => setAddToListForm({ ...addToListForm, expectedDeliveryDate: e.target.value })}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>

                                {/* Location Details */}
                                <div className="space-y-4">
                                    {/* Country Selection */}
                                    <div>
                                        <Label htmlFor="listCountry">Destination Country *</Label>
                                        <Select
                                            value={addToListForm.country}
                                            onValueChange={(value) => setAddToListForm({ ...addToListForm, country: value, incoterms: value !== 'India' ? addToListForm.incoterms : '' })}
                                        >
                                            <SelectTrigger id="listCountry">
                                                <SelectValue placeholder="Select country" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <ScrollArea className="h-[200px]">
                                                    {COUNTRIES.map((country) => (
                                                        <SelectItem key={country} value={country}>{country}</SelectItem>
                                                    ))}
                                                </ScrollArea>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Incoterms - Show only if country is not India */}
                                    {addToListForm.country && addToListForm.country !== 'India' && (
                                        <div>
                                            <Label htmlFor="listIncoterms">Incoterms *</Label>
                                            <Select
                                                value={addToListForm.incoterms}
                                                onValueChange={(value) => setAddToListForm({ ...addToListForm, incoterms: value })}
                                            >
                                                <SelectTrigger id="listIncoterms">
                                                    <SelectValue placeholder="Select Incoterms" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {INCOTERMS.map((incoterm) => (
                                                        <SelectItem key={incoterm.code} value={incoterm.code}>
                                                            {incoterm.code} - {incoterm.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* Indian location details - Show only if country is India */}
                                    {addToListForm.country === 'India' && (
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <Label htmlFor="listPincode">Pincode</Label>
                                                <Input
                                                    id="listPincode"
                                                    value={addToListForm.pincode}
                                                    onChange={(e) => setAddToListForm({ ...addToListForm, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                                    placeholder="6-digit"
                                                    maxLength={6}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="listCity">City</Label>
                                                <Input
                                                    id="listCity"
                                                    value={addToListForm.city}
                                                    onChange={(e) => setAddToListForm({ ...addToListForm, city: e.target.value })}
                                                    placeholder="Enter city"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="listState">State</Label>
                                                <Select
                                                    value={addToListForm.state}
                                                    onValueChange={(value) => setAddToListForm({ ...addToListForm, state: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select state" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <ScrollArea className="h-[200px]">
                                                            {INDIAN_STATES.map((state) => (
                                                                <SelectItem key={state} value={state}>{state}</SelectItem>
                                                            ))}
                                                        </ScrollArea>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    )}

                                    {/* International location details - Show only if country is not India */}
                                    {addToListForm.country && addToListForm.country !== 'India' && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label htmlFor="listCity">City</Label>
                                                <Input
                                                    id="listCity"
                                                    value={addToListForm.city}
                                                    onChange={(e) => setAddToListForm({ ...addToListForm, city: e.target.value })}
                                                    placeholder="Enter city"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="listState">State/Province</Label>
                                                <Input
                                                    id="listState"
                                                    value={addToListForm.state}
                                                    onChange={(e) => setAddToListForm({ ...addToListForm, state: e.target.value })}
                                                    placeholder="Enter state/province"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Shipping Address */}
                                <div>
                                    <Label htmlFor="listShippingAddress">Shipping Address</Label>
                                    <Textarea
                                        id="listShippingAddress"
                                        value={addToListForm.shippingAddress}
                                        onChange={(e) => setAddToListForm({ ...addToListForm, shippingAddress: e.target.value })}
                                        placeholder="Enter street address, landmark, etc."
                                        rows={2}
                                    />
                                </div>

                                {/* Notes */}
                                <div>
                                    <Label htmlFor="listNotes">Notes (Optional)</Label>
                                    <Textarea
                                        id="listNotes"
                                        value={addToListForm.notes}
                                        onChange={(e) => setAddToListForm({ ...addToListForm, notes: e.target.value })}
                                        placeholder="Any special requirements..."
                                        rows={2}
                                    />
                                </div>
                            </div>

                            <DialogFooter className="mt-4">
                                <Button variant="outline" onClick={() => setIsAddToListDialogOpen(false)} disabled={addingToList}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAddToList}
                                    disabled={addingToList || !addToListForm.productName || !addToListForm.quantity}
                                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                                >
                                    <List className="mr-2 h-4 w-4" />
                                    {addingToList ? "Adding..." : "Add Item"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default function BuyerDashboardPage() {
    return (
        <Suspense fallback={
            <DashboardLayout role="buyer">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Loading buyer dashboard...</p>
                    </div>
                </div>
            </DashboardLayout>
        }>
            <BuyerDashboardContent />
        </Suspense>
    );
}
