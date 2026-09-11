export function Brand({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <div className="font-script leading-[1.2]">
        Ana<span className="text-red-600">zz</span>us
      </div>
      <div className="text-[0.32em] tracking-[0.35em] uppercase opacity-70 mt-0.5">Boutique</div>
    </div>
  );
}
