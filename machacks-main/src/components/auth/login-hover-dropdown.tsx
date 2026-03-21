"use client";

import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  triggerClassName?: string;
};

/**
 * "Log in" label with hover menu: Sign up (any email) · Sign in (demo credentials).
 */
export function LoginHoverDropdown({ className, triggerClassName }: Props) {
  const { openAuthModal } = useAuth();

  return (
    <div className={cn("relative", className)}>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          openOnHover
          delay={60}
          closeDelay={220}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold uppercase tracking-widest text-white/50 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-indigo-500/40 sm:px-4 sm:text-sm",
            triggerClassName
          )}
        >
          Log in
          <ChevronDown className="h-3.5 w-3.5 opacity-50" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="min-w-[11rem] border border-violet-500/20 bg-[#0c0c0c]/95 p-1 text-white shadow-xl shadow-black/40 backdrop-blur-xl"
        >
          <DropdownMenuItem
            className="cursor-pointer rounded-lg px-3 py-2 text-sm text-white/90 focus:bg-violet-500/15 focus:text-white"
            onClick={() => openAuthModal("signup")}
          >
            Sign up
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer rounded-lg px-3 py-2 text-sm text-white/90 focus:bg-violet-500/15 focus:text-white"
            onClick={() => openAuthModal("login")}
          >
            Sign in
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
