import { LoaderCircle } from "lucide-react";

export default function AdminLoading() {
  return (
    <main className="mx-auto flex min-h-[55vh] w-full max-w-[1440px] items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <LoaderCircle className="h-7 w-7 animate-spin text-[#FF7130]" />
        <p className="text-sm font-semibold text-white/75">Loading Admin Panel…</p>
        <p className="text-xs text-white/35">Preparing your secure dashboard</p>
      </div>
    </main>
  );
}
