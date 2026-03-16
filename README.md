# 🏥 MedCommerce AI – Production-Grade Medical E-Commerce Platform

A full-stack, production-ready Medical E-Commerce application built with:

- Next.js (JavaScript, App Router)
- MongoDB Atlas + Mongoose
- Role-Based Authentication (Admin / Patient)
- Razorpay Payment Integration (Secure Backend Verification)
- n8n Automation Workflows
- AI Prescription & Health Record Analysis
- Dockerized for AWS Deployment

---

## 🚀 Overview

MedCommerce AI is a secure medical commerce system where:

Patients can:
- Browse medicines
- Upload prescriptions
- Place orders securely
- Track deliveries
- View order history
- Upload & analyze health reports
- Visualize health data in graphs

Admins can:
- Login via secure isolated admin panel
- Add/Edit/Delete medicines
- Manage orders customer-wise
- Update delivery tracking
- Monitor analytics
- Receive WhatsApp notifications on new orders

This system is built with production-level security practices.

---

## 🧠 Architecture

### High-Level Flow

User → Next.js Frontend  
→ API Routes  
→ MongoDB Atlas  
→ Razorpay (Payment)  
→ Signature Verification (Backend)  
→ n8n Webhooks  
→ WhatsApp Notifications  

Health Data Flow:

User Upload → Backend  
→ n8n AI Agent  
→ Structured JSON  
→ Database  
→ Frontend Graph Rendering (Recharts)

---

## 🔐 Role-Based Security Model

### Patient
- Stored in `users` collection
- Can view products without login
- Must login to:
  - Add to cart
  - Place order
  - Access dashboard

### Admin
- Stored in separate `admins` collection
- No public registration
- Pre-created manually via script
- Access only via `/admin/login`
- Protected via middleware
- Cannot be accessed by patients

If a patient tries accessing `/admin` → redirected to admin login.

---

## 💳 Razorpay Secure Payment Flow

1. Backend creates Razorpay order
2. Frontend opens payment modal
3. User completes payment
4. Backend verifies signature using crypto
5. Order marked as paid only after verification
6. n8n webhook triggered

Secrets are never exposed to frontend.

---

## 🧾 Prescription Automation

If prescriptionRequired = true:

- User must upload prescription
- File sent to n8n AI agent
- AI extracts:
  - Medicine name
  - Dosage
  - Frequency
- Backend auto-matches products
- Auto-adds to cart

If AI fails → user enters manually.

Checkout blocked if prescription missing.

---

## 📊 Health Record Intelligence

User uploads medical report.

n8n AI extracts:
- Heart rate
- Blood pressure
- Weight
- Sugar levels
- Blood group
- Previous prescriptions

Backend normalizes data into structured format.

Frontend displays:
- Line graphs
- Trend charts
- Summary cards

---

## 🐳 Docker & AWS Ready

Includes:

- Multi-stage Dockerfile
- docker-compose.yml
- .dockerignore
- Health check endpoint
- Production-ready build
- Environment variable separation
- Nginx reverse proxy (optional)

Deployable via:

- AWS EC2 (Docker)
- AWS ECS
- Elastic Beanstalk
- Vercel (Frontend alternative)

---

## 📂 Project Structure
app/
admin/
api/
components/
lib/
models/
middleware.js
scripts/
Dockerfile
docker-compose.yml
nginx.conf


---

## ⚙️ Environment Variables

Create `.env.local`:
# ==================================================
# MEDICONNECT — Local Development Environment
# ==================================================
# Copy this file to .env.local and fill in your values.
# NEVER commit .env.local to Git — it is already in .gitignore.
# ==================================================


# ==========================================
# 1. Database Connection (MongoDB)
# ==========================================
# 1. Go to https://mongodb.com and create a free Atlas account.
# 2. Build a Cluster → Setup Database User (save password) → Allow IP 0.0.0.0/0.
# 3. Click "Connect" → "Drivers" → Copy the connection string below.
MONGODB_URI=


# ==========================================
# 2. Authentication (NextAuth.js)
# ==========================================
NEXTAUTH_SECRET=
NEXTAUTH_URL=
JWT_SECRET=f


# ==========================================
# 3. Payment Integration (Razorpay)
# ==========================================
# Sign up at https://razorpay.com → Dashboard → Test Mode → API Keys.
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
# This is exposed to the browser for the Razorpay checkout modal.
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id


# ==========================================
# 4. File Upload (Cloudinary)
# ==========================================
# Create a free account at https://cloudinary.com → Dashboard.
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret


# ==========================================
# 5. n8n Automation Webhooks
# ==========================================
# ── How to get these URLs ──────────────────────────────────────────────────
# 1. Self-host n8n (https://docs.n8n.io/hosting/) or use n8n Cloud.
# 2. Import each JSON file from the /n8n/ folder into your n8n instance.
# 3. Activate the workflow → copy the "Webhook URL" shown at the top of the
#    Webhook trigger node → paste it below.
# ──────────────────────────────────────────────────────────────────────────

# [prescription-analysis.json] — AI prescription reader + auto-cart matcher
# This is exposed to the browser (needed in the checkout page).
NEXT_PUBLIC_N8N_PRESCRIPTION_WEBHOOK_URL=https://your-n8n-instance/webhook/mediconnect/prescription/analyze

# [admin-notification.json] — WhatsApp alert to admin on new order
N8N_WEBHOOK_URL=https://your-n8n-instance/webhook/mediconnect/order/admin

# [customer-confirmation.json] — WhatsApp confirmation to customer on order paid
N8N_CUSTOMER_WEBHOOK_URL=https://your-n8n-instance/webhook/mediconnect/order/customer

# [health-record AI analysis pipeline]
N8N_HEALTH_RECORD_WEBHOOK_URL=https://your-n8n-instance/webhook/mediconnect/health/analyze


# ==========================================
# 6. Internal Security (n8n ↔ App)
# ==========================================
# This secret protects the /api/prescription/match-products endpoint so that
# ONLY your n8n instance (not the public internet) can call it.
# Set the EXACT same value in your n8n workflow's HTTP Request node header:
#   Header name:  x-n8n-secret
#   Header value: <this value>
N8N_INTERNAL_SECRET=change-me-to-a-long-random-secret


# ==========================================
# 7. WhatsApp (configured inside n8n)
# ==========================================
# These are set as ENVIRONMENT VARIABLES inside n8n, NOT here.
# Go to n8n → Settings → Environment Variables and add:
#   WHATSAPP_PHONE_ID   = your Meta Cloud API phone ID
#   WHATSAPP_TOKEN      = your permanent Meta access token
#   ADMIN_PHONE         = admin WhatsApp number in E.164 format (e.g. 919876543210)
#   MEDICONNECT_BASE_URL= https://your-production-url.com  (or ngrok URL for local dev)
#   OPENAI_API_KEY      = sk-...  (for prescription AI analysis)



For production, configure environment variables in AWS / Vercel dashboard.

---

## 🔄 n8n Automations

### 1️⃣ Admin Notification Workflow
Trigger: Order placed  
Action:
- Send WhatsApp to owner with:
  - Order ID
  - Customer name
  - Items
  - Total

### 2️⃣ Customer Confirmation Workflow
Trigger: Successful payment  
Action:
- Send WhatsApp order summary
- Delivery estimate
- Tracking link

### 3️⃣ Health Analysis Workflow
Trigger: Health report upload  
Action:
- AI extraction
- Return structured JSON to backend

---

## 🛡 Security Features

- bcrypt password hashing
- JWT-based authentication
- Role-based middleware
- Admin route isolation
- Backend payment verification
- Input validation
- Secure environment variables
- No secret exposure
- HTTPS ready
- Health monitoring endpoint

---

## 📦 Installation (Local)

```bash
git clone <repo-url>
cd medcommerce-ai
npm install
npm run dev

🏗 Production Build
docker build -t medcommerce .
docker run -p 3000:3000 medcommerce

Or use docker-compose:

docker-compose up --build
📈 Future Improvements

Admin 2FA

Multi-vendor pharmacy support

Doctor dashboard

Subscription-based medicines

AI health prediction engine

CI/CD pipeline

Advanced monitoring & logging

🎯 Learning Goals Achieved

This project demonstrates:

Full-stack architecture

Secure authentication

Role isolation

Payment gateway integration

Webhook automation

AI data processing pipeline

Docker containerization

AWS deployment readiness

👨‍💻 Author

Built as a production-grade meditech system to explore:

Secure backend systems

Medical commerce workflows

Automation with AI

Cloud deployment architectu