# 🏥 MedChain: AI-Enhanced Pharma Supply Chain

**MedChain** is a decentralized, end-to-end supply chain management platform designed to bring transparency and efficiency to pharmaceutical logistics. By leveraging the MERN stack and AI-driven development, this project aims to solve critical issues like expired goods tracking and counterfeit prevention.

---

## Admin Isolation Architecture

### Folder structure

- `models/Admin.js`: isolated administrator collection with immutable `role: "admin"`.
- `models/User.js`: patient-only collection. Public registration cannot create admins.
- `lib/auth.js`: separate patient and admin credential verification with a shared JWT strategy.
- `middleware.js`: edge protection for `/admin`, `/api/admin`, and admin-only product mutations.
- `app/admin/login/page.js`: dedicated admin login with no sign-up flow.
- `app/api/products/*`: database-backed product read/write flow. Reads are public; writes require an admin token.
- `app/api/payments/*`: patient checkout with server-side total verification and stock reduction after verified payment.

### Middleware logic

- Any request to `/admin/*` checks the JWT role before the page renders.
- Unauthenticated users are redirected to `/admin/login`.
- Logged-in patients are also redirected to `/admin/login` and never reach the admin UI.
- Admin APIs and product write routes are blocked unless the token role is `admin`.

### JWT verification

- `patient-credentials` only checks the `User` collection.
- `admin-credentials` only checks the `Admin` collection.
- The JWT stores `id` and `role`.
- Server routes validate the token role. The frontend role is never trusted for privileged actions.

### Request lifecycle flow

1. Patient signs in at `/login` against the patient collection.
2. Admin signs in at `/admin/login` against the admin collection.
3. NextAuth signs a JWT containing the user id and role.
4. Middleware verifies the JWT before `/admin/*` and protected APIs execute.
5. Admin product updates write directly to MongoDB, and the patient catalog reads the same product collection, so changes appear immediately.
6. Checkout recalculates prices from live products on the server to stop client-side price tampering.
7. Stock is reduced only after payment signature verification succeeds.

### Why separate admin storage is more secure

- A patient registration bug cannot create an admin record in a different collection.
- Authentication lookups do not mix privileged and non-privileged identities.
- Production systems commonly isolate privileged identities with separate stores, stricter provisioning, and narrower login surfaces for exactly this reason.

### Role-based protection model

- Public users can browse medicines.
- Only authenticated patients or admins can use patient ordering flows.
- Only admins can access `/admin/dashboard`, `/admin/products`, `/admin/orders`, and admin write APIs.
- Admins can still access `/dashboard`, which renders the patient-side experience.

## 🤖 AI as a Co-Pilot

This project was built using an **AI-Assisted Development** workflow. Here is how AI was utilized:

* **Architecture Design:** AI helped design the dual-database security model to separate sensitive Admin credentials from public pharma data.
* **Rapid Prototyping:** Used AI to generate robust Mongoose schemas and Next.js API routes, allowing more focus on the business logic of medical logistics.
* **Learning & Debugging:** AI acted as a 24/7 senior mentor, explaining complex DevOps concepts like Docker orchestration and middleware security.

### 💡 Using AI to Learn from this Repo

1. **Code Walkthroughs:** Copy a specific function into an LLM and ask: *"Explain the logic of this medical shipment tracker line-by-line."*
2. **Scenario Simulation:** Ask: *"How would I modify this schema to include cold-chain temperature monitoring?"*
3. **Security Audits:** Use AI to review the `middleware.js` to ensure the Admin dashboard is impenetrable.

---

## 🚀 Local Development Setup

This project is configured to run entirely on **local hardware** to ensure 100% privacy and $0 hosting costs.

### Prerequisites

* **Node.js** (v18+)
* **MongoDB Community Server** (Running locally)
* **MongoDB Compass** (For database management)

### 1. Database Setup (Local)

1. Open **MongoDB Compass**.
2. Connect to `mongodb://localhost:27017`.
3. (Optional) Create a database named `admin-secure-db` and manually insert your first admin user into the `admins` collection.

### 2. Environment Variables

Create a `.env.local` file in the root directory and paste the following:

```env
# Database Connections
MONGODB_URI=mongodb://localhost:27017/med-ecommerce
ADMIN_DB_URI=mongodb://localhost:27017/admin-secure-db

# Authentication
NEXTAUTH_SECRET=your_generated_secret_here
NEXTAUTH_URL=http://localhost:3000

# Payments (Test Mode)
RAZORPAY_KEY_ID=your_test_key
RAZORPAY_KEY_SECRET=your_test_secret

```

### 3. Installation

```bash
# Clone the repository
git clone https://github.com/your-username/medchain.git

# Install dependencies
npm install

# Run the development server
npm run dev

```

Visit [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) to view the application.

---

## 🛡️ Security Architecture

* **Dual-DB Isolation:** Admin credentials are stored in a physically separate database from the medical inventory.
* **RBAC (Role-Based Access Control):** Patients can browse medicine, but only verified Admins can modify rates or descriptions.
* **No Public Sign-up:** The Admin portal has no "Sign Up" route; all admins must be added manually via the local database for maximum security.

---

## 🛠️ Tech Stack

* **Frontend:** Next.js, Tailwind CSS
* **Backend:** Node.js, NextAuth.js
* **Database:** MongoDB (Local)
* **DevOps Tools:** Docker (Optional), MongoDB Compass

---
