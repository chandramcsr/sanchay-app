"use client";

import { useState } from "react";

import { computeAllocationArcs, type AllocationSlice } from "~/lib/budget-allocation";
import { formatMoney } from "~/lib/format";

/**
 * Hand-rolled SVG donut chart -- no charting library dependency, plain
 * SVG arc math, matching ledger-app's own BudgetAllocationChart
 * approach exactly (same reasoning: this is genuinely simple enough
 * that a dependency isn't worth it, and it keeps this in the same
 * visual language as the rest of the app rather than whatever a
 * library's defaults look like).
 */
export function BudgetAllocationChart({ slices, total }: { slices: AllocationSlice[]; total: number }) {
  const [selected, setSelected] = useState<string | null>(null);
  const size = 200;
  const r = 90;
  const rInner = r * 0.55;
  const cx = size / 2;
  const cy = size / 2;

  function polarToCartesian(angleDeg: number, radius: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  function describeSlice(startAngle: number, endAngle: number) {
    const outerStart = polarToCartesian(startAngle, r);
    const outerEnd = polarToCartesian(endAngle, r);
    const innerStart = polarToCartesian(startAngle, rInner);
    const innerEnd = polarToCartesian(endAngle, rInner);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${r} ${r} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${rInner} ${rInner} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
      "Z",
    ].join(" ");
  }

  const arcs = computeAllocationArcs(slices, total).map((a) => {
    const midAngle = (a.startAngle + a.endAngle) / 2;
    const labelR = rInner + (r - rInner) * 0.72;
    const labelRad = ((midAngle - 90) * Math.PI) / 180;
    return {
      ...a,
      path: describeSlice(a.startAngle, a.endAngle),
      lx: cx + labelR * Math.cos(labelRad),
      ly: cy + labelR * Math.sin(labelRad),
    };
  });

  const selectedArc = arcs.find((a) => a.name === selected) ?? null;

  return (
    <div className="flex justify-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-52">
        {arcs.map((a) => (
          <path
            key={a.name}
            d={a.path}
            fill={a.color}
            stroke="#FFFFFF"
            strokeWidth={a.name === selected ? 3 : 1.5}
            opacity={selected && a.name !== selected ? 0.45 : 1}
            className="cursor-pointer transition-opacity"
            onClick={() => setSelected((s) => (s === a.name ? null : a.name))}
          />
        ))}
        {arcs
          .filter((a) => a.pct >= 6)
          .map((a) => (
            <text
              key={a.name}
              x={a.lx}
              y={a.ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="12"
              fontWeight="700"
              fill="#FFFFFF"
              fontFamily="var(--font-mono)"
              className="pointer-events-none"
            >
              {Math.round(a.pct)}%
            </text>
          ))}
        {selectedArc ? (
          <>
            <text
              x={cx}
              y={cy - 8}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="14"
              fontWeight="700"
              fill="#1C2541"
              className="pointer-events-none"
            >
              {selectedArc.name}
            </text>
            <text
              x={cx}
              y={cy + 12}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="12"
              fontFamily="var(--font-mono)"
              fill="#6B7280"
              className="pointer-events-none"
            >
              {Math.round(selectedArc.pct)}% · {formatMoney(selectedArc.value)}
            </text>
          </>
        ) : (
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="11"
            fill="#6B7280"
            className="pointer-events-none"
          >
            Tap a slice
          </text>
        )}
      </svg>
    </div>
  );
}
