import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TournamentNotFound() {
  return (
    <>
      <Navbar />
      <main className="section-dark min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-heading text-4xl font-bold text-white mb-3">
            Tournament not found
          </h1>
          <p className="text-white/60 mb-6">
            This tournament does not exist or has been removed.
          </p>
          <Link href="/tournaments" className="btn btn-primary">
            Browse tournaments
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
