export default function TournamentSkeleton() {
  return (
    <div className="card-dark animate-pulse overflow-hidden">
      <div className="h-36 bg-white/5" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-white/10 rounded w-3/4" />
        <div className="h-4 bg-white/5 rounded w-1/2" />
        <div className="flex justify-between pt-2">
          <div className="h-6 bg-white/10 rounded w-20" />
          <div className="h-10 bg-white/10 rounded w-24" />
        </div>
      </div>
    </div>
  );
}
