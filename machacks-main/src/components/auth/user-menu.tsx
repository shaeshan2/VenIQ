"use client";

import { User, LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function initials(username: string) {
  const u = username.trim();
  if (!u) return "?";
  return u.slice(0, 2).toUpperCase();
}

export function UserMenu({ className }: { className?: string }) {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "h-9 w-9 shrink-0 rounded-full border border-indigo-500/35 bg-gradient-to-br from-indigo-500/25 to-purple-600/20 p-0 text-indigo-100 shadow-inner shadow-indigo-500/10 transition-transform hover:scale-105 hover:border-indigo-400/50 active:scale-95",
              className
            )}
            aria-label="Account menu"
          >
            <span className="text-[11px] font-black tracking-tight">
              {initials(user.username)}
            </span>
          </Button>
        }
      />
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="min-w-[220px] border border-white/10 bg-[#0c0c0c]/95 p-1.5 text-white shadow-2xl shadow-black/50 backdrop-blur-xl"
      >
        <DropdownMenuLabel className="px-3 py-2 text-white/40">
          <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/90">
            <Sparkles className="h-3 w-3" />
            Signed in
          </span>
          <span className="mt-1.5 block truncate font-mono text-sm font-semibold text-white">
            {user.username}
          </span>
          {user.email ? (
            <span className="mt-0.5 block truncate text-xs text-white/45">
              {user.email}
            </span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem
          disabled
          className="cursor-default gap-2 rounded-lg text-white/35 focus:bg-white/5 focus:text-white/35"
        >
          <User className="h-4 w-4" />
          Profile (demo)
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            logout();
            toast.message("Signed out", {
              description: "See you next time.",
            });
          }}
          className="mt-0.5 gap-2 rounded-lg text-red-300 focus:bg-red-500/15 focus:text-red-200"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
