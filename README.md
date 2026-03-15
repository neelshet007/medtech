# 🏥 MedChain: AI-Enhanced Pharma Supply Chain

**MedChain** is a decentralized, end-to-end supply chain management platform designed to bring transparency and efficiency to pharmaceutical logistics. By leveraging the MERN stack and AI-driven development, this project aims to solve critical issues like expired goods tracking and counterfeit prevention.

---

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
