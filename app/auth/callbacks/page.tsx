"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Callbacks() {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "error">("checking");

  useEffect(() => {
    let cancelled = false;

    const resolveSession = async () => {
      const { data, error } = await authClient.getSession();

      if (cancelled) return;

      if (error || !data?.session || !data?.user) {
        setStatus("error");
        setTimeout(() => {
          router.push("/auth/login");
        }, 1500);
        return;
      }

      const role = data.user.role;

      if (role === "admin") {
        router.push("/admin");
        return;
      }

      if (role === "operator") {
        router.push("/operator/users");
        return;
      }

      router.push("/user");
    };

    resolveSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-4">
        <div className="h-2 w-2 animate-pulse bg-brass" />
        <p className="font-mono text-[12px] tracking-[0.2em] text-muted">
          {status === "checking"
            ? "VERIFYING SESSION"
            : "SESSION NOT FOUND — REDIRECTING"}
        </p>
      </div>
    </main>
  );
}
