"use client";

import { useEffect, useId, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { KeyRound, Sparkles, Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEMO_PASSWORD,
  DEMO_USERNAME,
  useAuth,
  type AuthMode,
} from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  mode: AuthMode;
  onOpenChange: (open: boolean) => void;
};

export function AuthDialog({ open, mode, onOpenChange }: Props) {
  const { login, signUp, setAuthModal } = useAuth();
  const formId = useId();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const isLogin = mode === "login";

  function resetForm() {
    setUsername("");
    setEmail("");
    setPassword("");
    setError(null);
    setPending(false);
    setShowPassword(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  useEffect(() => {
    if (!open) return;
    setUsername("");
    setEmail("");
    setPassword("");
    setError(null);
    setPending(false);
    setShowPassword(false);
    const firstId = mode === "login" ? `${formId}-user` : `${formId}-email`;
    const t = requestAnimationFrame(() => {
      (document.getElementById(firstId) as HTMLInputElement | null)?.focus();
    });
    return () => cancelAnimationFrame(t);
  }, [open, mode, formId]);

  function fillDemo() {
    setUsername(DEMO_USERNAME);
    setPassword(DEMO_PASSWORD);
    setError(null);
    toast.message("Demo credentials filled", {
      description: "Tap Log in to continue.",
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (isLogin) {
      if (!username.trim() || !password) {
        setError("Enter username and password.");
        return;
      }
      setPending(true);
      window.setTimeout(() => {
        const result = login(username, password);
        setPending(false);
        if (result.ok) {
          toast.success("Welcome!", {
            description: `Signed in as ${result.username}.`,
          });
          resetForm();
          onOpenChange(false);
        } else {
          setError(result.error);
        }
      }, 160);
      return;
    }

    if (!email.trim() || !password) {
      setError("Enter email and password.");
      return;
    }
    setPending(true);
    window.setTimeout(() => {
      const result = signUp(email, password);
      setPending(false);
      if (result.ok) {
        toast.success("Account ready!", {
          description: `Signed in as ${result.username}.`,
        });
        resetForm();
        onOpenChange(false);
      } else {
        setError(result.error);
      }
    }, 160);
  }

  const canSubmit = isLogin
    ? username.trim().length > 0 && password.length > 0 && !pending
    : email.trim().length > 0 && password.length > 0 && !pending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "max-w-[calc(100%-1.5rem)] gap-0 overflow-hidden border border-white/10 bg-[#080808] p-0 text-white shadow-[0_0_80px_rgba(99,102,241,0.18)] backdrop-blur-2xl sm:max-w-[420px]",
          "data-[open]:animate-in data-[closed]:animate-out"
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.25),transparent)]" />
        <div className="pointer-events-none absolute -right-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-purple-500/10 blur-3xl" />

        <div className="relative px-6 pb-6 pt-8">
          <DialogHeader className="space-y-4 text-left">
            <div className="flex items-start gap-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/30"
              >
                <span className="font-black text-2xl text-white">S</span>
              </motion.div>
              <div className="min-w-0 flex-1 space-y-1 pt-0.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/90">
                    SoundSmith
                  </span>
                </div>
                <DialogTitle className="text-2xl font-black tracking-tight text-white">
                  {isLogin ? "Log in" : "Sign up"}
                </DialogTitle>
                <DialogDescription className="text-sm leading-relaxed text-white/45">
                  {isLogin
                    ? "Use the demo account to try the workspace. Sessions stay on this browser only."
                    : "Create a demo account — no verification. Anything you enter works for this build."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form
            id={formId}
            onSubmit={handleSubmit}
            className="relative mt-8 space-y-5"
          >
            {isLogin ? (
              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-user`}
                  className="text-xs font-bold uppercase tracking-widest text-white/50"
                >
                  Username
                </Label>
                <Input
                  id={`${formId}-user`}
                  name="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError(null);
                  }}
                  placeholder={DEMO_USERNAME}
                  className="h-11 rounded-xl border-white/10 bg-white/[0.06] text-white placeholder:text-white/25 focus-visible:border-indigo-500/40 focus-visible:ring-2 focus-visible:ring-indigo-500/20"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-email`}
                  className="text-xs font-bold uppercase tracking-widest text-white/50"
                >
                  Email
                </Label>
                <Input
                  id={`${formId}-email`}
                  name="email"
                  type="text"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="you@example.com"
                  className="h-11 rounded-xl border-white/10 bg-white/[0.06] text-white placeholder:text-white/25 focus-visible:border-indigo-500/40 focus-visible:ring-2 focus-visible:ring-indigo-500/20"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor={`${formId}-pass`}
                className="text-xs font-bold uppercase tracking-widest text-white/50"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id={`${formId}-pass`}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="••••••••"
                  className="h-11 rounded-xl border-white/10 bg-white/[0.06] pr-11 text-white placeholder:text-white/25 focus-visible:border-indigo-500/40 focus-visible:ring-2 focus-visible:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-white/35 transition-colors hover:bg-white/10 hover:text-white/70"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {isLogin ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.08] p-4">
                <div className="flex items-center gap-2 text-indigo-200/90">
                  <KeyRound className="h-4 w-4 shrink-0 text-indigo-400" />
                  <p className="text-xs leading-relaxed">
                    <span className="font-semibold text-white/90">Demo login:</span>{" "}
                    <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[11px] text-white/90">
                      {DEMO_USERNAME}
                    </code>{" "}
                    ·{" "}
                    <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[11px] text-white/90">
                      {DEMO_PASSWORD}
                    </code>
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={fillDemo}
                  className="h-9 w-full rounded-full border-indigo-500/30 bg-indigo-500/10 text-xs font-bold uppercase tracking-widest text-indigo-200 hover:bg-indigo-500/20 hover:text-white"
                >
                  Fill demo credentials
                </Button>
              </div>
            ) : null}

            <AnimatePresence mode="wait">
              {error ? (
                <motion.p
                  key={error}
                  role="alert"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-center text-sm font-medium text-red-400"
                >
                  {error}
                </motion.p>
              ) : null}
            </AnimatePresence>

            <Button
              type="submit"
              disabled={!canSubmit}
              className="h-12 w-full rounded-full bg-white font-black uppercase tracking-[0.15em] text-black shadow-[0_0_40px_rgba(255,255,255,0.12)] transition-all hover:scale-[1.02] hover:bg-gray-100 active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
            >
              {pending ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                  {isLogin ? "Logging in…" : "Creating…"}
                </span>
              ) : isLogin ? (
                <span className="inline-flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Log in
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Sign up
                </span>
              )}
            </Button>

            <p className="text-center text-[11px] text-white/35">
              {isLogin ? (
                <>
                  Need a throwaway account?{" "}
                  <button
                    type="button"
                    className="font-semibold text-indigo-400/90 underline-offset-2 hover:text-indigo-300 hover:underline"
                    onClick={() => setAuthModal({ open: true, mode: "signup" })}
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Have the demo account?{" "}
                  <button
                    type="button"
                    className="font-semibold text-indigo-400/90 underline-offset-2 hover:text-indigo-300 hover:underline"
                    onClick={() => setAuthModal({ open: true, mode: "login" })}
                  >
                    Log in
                  </button>
                </>
              )}
            </p>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
