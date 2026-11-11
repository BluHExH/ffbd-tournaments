"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";

export function AdminLogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/5 transition"
      title="Logout"
    >
      <LogOut className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Logout</span>
    </button>
  );
}
