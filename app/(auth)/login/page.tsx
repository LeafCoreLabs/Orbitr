import React, { Suspense } from "react";
import { AuthView } from "@/components/auth/AuthView";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#040917]" />}>
      <AuthView initialMode="login" />
    </Suspense>
  );
}
