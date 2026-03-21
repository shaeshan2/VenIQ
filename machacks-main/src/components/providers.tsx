"use client";

import type { ReactNode } from "react";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { SignInDialog } from "@/components/auth/sign-in-dialog";

function AuthChrome({ children }: { children: ReactNode }) {
  const { signInOpen, setSignInOpen } = useAuth();
  return (
    <>
      {children}
      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
    </>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthChrome>{children}</AuthChrome>
    </AuthProvider>
  );
}
