import { connectToDatabase } from "./lib/db.js";
import { Admin } from "./models/Admin.js";
import bcrypt from "bcryptjs";
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables for local script execution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env.local') });

async function createSuperAdmin() {
  try {
    console.log("Connecting to database...");
    await connectToDatabase();
    
    const adminEmail = "admin@mediconnect.com";
    
    // Check if an admin already exists
    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log(`❌ Setup aborted: Admin ${adminEmail} already exists in the database.`);
      process.exit(0);
    }

    console.log(`Creating isolated super admin account: ${adminEmail}`);
    
    // Hash the secure password
    const plainPassword = "SecureAdmin#2024!";
    const hashedPassword = await bcrypt.hash(plainPassword, 12);
    
    await Admin.create({
      name: "Super Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin"
    });

    console.log(`
✅ SUPER ADMIN CREATED SUCCESSFULLY in 'admins' collection!
------------------------------------------------------
Email: ${adminEmail}
Password: ${plainPassword}
------------------------------------------------------
* DO NOT share these credentials. Use them to log into /admin/login.
    `);
    
    process.exit(0);
  } catch (error) {
    console.error("Failed to create Super Admin:", error);
    process.exit(1);
  }
}

createSuperAdmin();
