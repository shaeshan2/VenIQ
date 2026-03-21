"use client";

import type { ReactNode } from "react";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { AuthDialog } from "@/components/auth/auth-dialog";

function AuthChrome({ children }: { children: ReactNode }) {
  const { authModal, setAuthModal } = useAuth();
  return (
    <>
      {children}
      <AuthDialog
        open={authModal.open}
        mode={authModal.mode}
        onOpenChange={(open) =>
          setAuthModal((m) => ({ ...m, open }))
        }
      />
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
