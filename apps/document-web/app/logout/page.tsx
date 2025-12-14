"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { authClient } from "@repo/web-lib";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      try {
        await authClient.signOut();
        router.push("/login");
      } catch (error) {
        console.error("Logout failed:", error);
        router.push("/login");
      }
    };

    logout();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Logging out...</p>
      </div>
    </div>
  );
}
