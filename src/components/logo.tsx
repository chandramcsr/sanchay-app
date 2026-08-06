export function Logo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-xl bg-navy"
      style={{ width: size, height: size }}
    >
      {/* A simple pear/teardrop mark -- Sanchay's existing icon motif
          (seen in the PWA icon), redrawn here in plain SVG so it's not
          dependent on an external image asset shipping correctly. */}
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2c1.5 2 2 3.5 1.5 5-2.5.5-4.5 3-4.5 6.5a5 5 0 1 0 10 0c0-3-1.5-5-3.5-7C14.5 5 13 3 12 2Z"
          fill="var(--color-gold)"
        />
      </svg>
    </div>
  );
}
