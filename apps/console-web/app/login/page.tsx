"use client";

import { useRouter } from "next/navigation";
import { authClient, LoginForm } from "@repo/web-lib";

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async (email: string, password: string) => {
    const result = await authClient.signIn.email({
      email,
      password,
    });

    const resultWithUser = result as unknown as { user?: { id: string } };
    const user = result.data?.user || resultWithUser.user;
    const hasError = result.error;

    if (hasError) {
      throw new Error(result.error.message || "Login failed");
    }

    if (user) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const sessionCheck = await authClient.getSession();
      if (sessionCheck?.data?.user) {
        router.push("/");
        router.refresh();
      } else {
        window.location.href = "/";
      }
    } else {
      throw new Error("Login failed. Unexpected response.");
    }
  };

  return <LoginForm appName="Console" onSubmit={handleLogin} />;
}
