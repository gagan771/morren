# 🏢 Company Landing Page & Auth Flow Update

I have transformed the main landing page into a professional corporate site for **Morera Ventures LLP** and implemented a secure authentication flow.

## 🌟 New Features

### 1. **Corporate Landing Page (`/`)**
- **Brand Identity**: Prominently features "Morera Ventures LLP" as a premier exporting firm based in Bengaluru.
- **Company Profile**: Highlights the focus on sustainable/eco-friendly products and MSME registration status.
- **Product Showcase**:
  - **Eco-Friendly**: Areca Plates, Coconut Shell Bowls, Bamboo Straws, etc.
  - **Agro Products**: Dry Ginger, Onion, Potato, Sugar, Rice, Fruits.
  - **Safety Essentials**: Masks, Face Shields, Gloves, PPE Kits.
- **Premium Design**: Uses Aceternity UI components (Background Beams, 3D Cards) for a high-end look.

### 2. **Authentication System (`/auth`)**
- **New Sign In/Sign Up Page**: A dedicated page for user authentication.
- **Aceternity Form**: Implemented the requested high-quality sign-up form design.
- **Role-Based Redirects**:
  - Clicking "Login as Buyer" -> Redirects to Auth Page -> Redirects to Buyer Dashboard
  - Clicking "Login as Seller" -> Redirects to Auth Page -> Redirects to Seller Dashboard
  - Clicking "Login as Admin" -> Redirects to Auth Page -> Redirects to Admin Dashboard

### 3. **User Flow**
1. **Visitor** lands on `http://localhost:3000` and learns about Morera Ventures.
2. **Visitor** clicks on a specific portal card (e.g., "Buyer Portal").
3. **System** redirects to `/auth?role=buyer`.
4. **User** fills out the sign-up form.
5. **System** simulates login and redirects to `/dashboard/buyer`.

## 🛠️ Technical Changes
- Created `app/auth/page.tsx` with the Aceternity Sign Up form.
- Created `components/ui/aceternity/form-utils.tsx` for form styling helpers.
- Updated `app/page.tsx` with company content and new routing logic.
- Installed `@tabler/icons-react` for form icons.

## 🚀 How to Test
1. Go to the **Home Page**: http://localhost:3000
2. Read the company information.
3. Click on **"Login as Buyer"** in the 3D card.
4. Fill out the form (or just click "Sign up").
5. Watch the redirect to the **Buyer Dashboard**.
