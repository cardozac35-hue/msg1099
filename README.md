# Oil & Gas Sales Hub

**Oil & Gas Sales Hub** is a production-oriented B2B Sales Quotation and Enquiry Management System designed for oilfield equipment, piping, valves, instrumentation, and industrial supplies.

Built with **Next.js 14 App Router (TypeScript)**, **Tailwind CSS**, **MongoDB Atlas (Mongoose)**, **Cloudinary Document Management**, **ExcelJS**, and **PDFKit**.

---

## 1. Key Features & Industrial Architecture

### Field-Level Security & Role-Based Access Control (RBAC)
- **Administrator**:
  - Full access to all customer enquiries and records.
  - Complete management of suppliers, purchase prices, and supplier quotes.
  - Landed cost formula calculations, gross profit, and gross margin analysis.
  - Quotation margin approval workflows.
  - Role-gated Master Sheet export (including confidential cost and margin columns).
  - User management, system settings, and append-oriented audit logs.
- **Salespeople**:
  - Log in with dedicated credentials (Salesperson 1 & Salesperson 2).
  - Cross-user shared customer enquiry register.
  - View customer target prices and selling prices.
  - Quotation Builder within approval thresholds.
  - Customer touchpoints and follow-up management.
  - Role-gated exports containing **only** non-confidential commercial data.
  - **Zero Access Guarantee**: Server-side handlers enforce strict projection barriers. Salespeople cannot retrieve supplier purchase costs, landed costs, confidential supplier documents, or profit margins by direct API calls or request manipulation.

### Technical Specification Engine
- Support for API 6D, API 600, ASME B16.34, ASME B16.5, ASTM A216 WCB, Inconel 625, and other metallurgy standards.
- Concurrency-safe atomic sequence counters: `ENQ-2026-XXXX` and `QT-2026-XXXX-R0`.
- Real-time duplicate enquiry warning detection based on customer and technical specifications.

### Pricing, Landed Cost & Profitability Formulas
$$\text{Landed Cost per Unit} = \text{Unit Purchase Price} + \frac{\text{Allocated Freight}}{\text{Quantity}} + \frac{\text{Customs \& Duties}}{\text{Quantity}} + \text{Other Applicable Costs}$$

$$\text{Gross Profit} = \text{Revenue (Ex-Tax)} - \text{Total Landed Cost}$$

$$\text{Gross Margin \%} = \frac{\text{Gross Profit}}{\text{Revenue (Ex-Tax)}} \times 100$$

### Quotation Revision Control & PDFs
- Sent quotations are immutable. Editing a sent quotation automatically generates revision $N+1$ (`QT-2026-0001-R1`) and archives the prior revision.
- Server-side PDF generation via **PDFKit** featuring corporate branding, terms of delivery (Incoterms 2020), payment terms, and itemized specifications.

### Cloudinary Document Repository
- Server-side signed uploads and time-limited signed delivery URLs for private/confidential supplier documents.
- Validation for file size ($\le 25\text{ MB}$) and MIME types (PDF, XLSX, MTC certificates, drawings).

---

## 2. Technology Stack

- **Framework**: Next.js 14 App Router (React 18, TypeScript)
- **Styling**: Tailwind CSS (Industrial Maroon `#781F32` & Charcoal `#242C36` palette)
- **Database**: MongoDB Atlas with Mongoose
- **Authentication**: Server-side JWT session cookies via `jose` and `bcryptjs`
- **File Management**: Cloudinary API with private signed URL authorization
- **Calculations & Data**: ExcelJS (Role-gated multi-sheet exports), PDFKit (Vector quotation PDFs)
- **Analytics**: Recharts
- **Test Runner**: Automated Test Suite via `tsx`

---

## 3. Initial Accounts & Credentials

The system provides 3 pre-configured role accounts:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Administrator** | `admin@oilgashub.com` | `AdminPass2026!` | Full tender desk, supplier costs, landed costs, margins, settings, audit logs |
| **Salesperson 1** | `sales1@oilgashub.com` | `Sales1Pass2026!` | Shared enquiry register, quote builder, follow-ups (costs isolated) |
| **Salesperson 2** | `sales2@oilgashub.com` | `Sales2Pass2026!` | Shared enquiry register, quote builder, follow-ups (costs isolated) |

---

## 4. Local Development Quickstart

### Prerequisites
- Node.js v18+ or v20+
- npm v10+

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### Step 3: Run Database Seed (Optional)
If connected to a live MongoDB instance, populate initial seed data:
```bash
npm run seed
```
*(Note: If running offline without MongoDB Atlas, the system automatically uses its high-fidelity in-memory state preloaded with initial seed data).*

### Step 4: Run Automated Security Test Suite
```bash
npm run test
```

### Step 5: Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. Use the one-click demo credentials on the login screen to explore both Admin and Salesperson experiences.

---

## 5. Deployment Guide (Vercel & MongoDB Atlas)

### MongoDB Atlas Setup
1. Create a cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Under **Network Access**, add `0.0.0.0/0` (or Vercel IP range) to allow serverless connection.
3. Under **Database Access**, create a user with `readWrite` privileges.
4. Copy the connection string into `MONGODB_URI`:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/oil_gas_sales_hub?retryWrites=true&w=majority
   ```

### Cloudinary Configuration
1. Sign up on [Cloudinary](https://cloudinary.com).
2. Retrieve your **Cloud Name**, **API Key**, and **API Secret** from the dashboard.
3. Add them to your environment variables:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

### Vercel Deployment
1. Import the repository into [Vercel](https://vercel.com).
2. Configure the following environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET` (generate with `openssl rand -hex 32`)
   - `COOKIE_NAME=ogsh_session`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `NEXT_PUBLIC_APP_NAME="Oil & Gas Sales Hub"`
   - `NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app`
3. Click **Deploy**.
