import { ReactNode } from "react";
import { AdminShell } from "./AdminShell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0B1221] text-white antialiased">
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
