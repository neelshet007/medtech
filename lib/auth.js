import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { connectToDatabase } from "@/lib/db";
import { Admin } from "@/models/Admin";
import { User } from "@/models/User";

async function authorizePatient(credentials) {
  if (!credentials?.email || !credentials?.password) {
    throw new Error("Email and password are required.");
  }

  await connectToDatabase();

  const user = await User.findOne({ email: credentials.email.toLowerCase().trim() });
  if (!user) {
    throw new Error("Invalid email or password.");
  }

  const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password.");
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: "patient",
  };
}

async function authorizeAdmin(credentials) {
  if (!credentials?.email || !credentials?.password) {
    throw new Error("Email and password are required.");
  }

  await connectToDatabase();

  // Admin authentication is isolated to the dedicated admin collection.
  const admin = await Admin.findOne({ email: credentials.email.toLowerCase().trim() }).select("+password");
  if (!admin) {
    throw new Error("Invalid admin credentials.");
  }

  const isPasswordValid = await bcrypt.compare(credentials.password, admin.password);
  if (!isPasswordValid) {
    throw new Error("Invalid admin credentials.");
  }

  return {
    id: admin._id.toString(),
    name: admin.name,
    email: admin.email,
    role: "admin",
  };
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      id: "patient-credentials",
      name: "Patient Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: authorizePatient,
    }),
    CredentialsProvider({
      id: "admin-credentials",
      name: "Admin Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: authorizeAdmin,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export function auth() {
  return getServerSession(authOptions);
}
