"use client";

import { signOut } from "next-auth/react";

export function LogoutButton({ callbackUrl = "/", className = "", children = "Log Out" }) {
  return (
    <button onClick={() => signOut({ callbackUrl })} className={className}>
      {children}
    </button>
  );
}
