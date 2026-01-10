import { useState, useEffect } from 'react';

interface NetWorthBarProps {
  assets: number;
  liabilities: number;
}

export function NetWorthBar({ assets, liabilities }: NetWorthBarProps) {
  // Guard against negative values just in case
  const safeAssets = Math.max(0, assets);
  const safeLiabilities = Math.max(0, liabilities);
  const netWorth = safeAssets - safeLiabilities;

  // Calculate percentages based on Total Assets (Gross)
  // If Assets = 0, we can't divide.
  // If Liabilities > Assets, Debt is 100% (visually), NW is 0%.

  let nwPercent = 0;
  let debtPercent = 0;

  if (safeAssets > 0) {
    debtPercent = Math.min(100, (safeLiabilities / safeAssets) * 100);
    nwPercent = 100 - debtPercent;
  } else if (safeLiabilities > 0) {
    // 0 Assets, but have Debt -> 100% Debt
    debtPercent = 100;
    nwPercent = 0;
  }

  // Animation state
  const [animatedNw, setAnimatedNw] = useState(0);

  useEffect(() => {
    // Simple ease-out animation on mount/change
    const timeout = setTimeout(() => setAnimatedNw(nwPercent), 100);
    return () => clearTimeout(timeout);
  }, [nwPercent]);

  return (
    <div className="w-full">
      {/* Header Labels */}
      <div className="flex justify-between mb-3">
        <div>
          <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-0.5">Net Worth</p>
          <p className="text-xl font-bold text-emerald-400">
            ${netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-0.5">Liabilities</p>
          <p className="text-xl font-bold text-rose-400">
            ${safeLiabilities.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* The Stacked Bar */}
      <div className="relative h-4 w-full bg-zinc-800 rounded-full overflow-hidden flex">
        {/* Emerald Segment (Net Worth) */}
        <div
          className="h-full bg-emerald-500 transition-all duration-1000 ease-out relative group"
          style={{ width: `${animatedNw}%` }}
        >
          {/* Hover Tooltip for Net Worth */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-zinc-700 pointer-events-none">
            {Math.round(nwPercent)}% Equity
          </div>
        </div>

        {/* Rose Segment (Liabilities) */}
        <div
          className="h-full bg-rose-500 transition-all duration-1000 ease-out relative group"
          style={{ width: `${100 - animatedNw}%` }}
        >
          {/* Hover Tooltip for Liabilities */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-zinc-700 pointer-events-none">
            {Math.round(debtPercent)}% Debt
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="flex justify-between mt-2 text-xs text-zinc-500 font-mono">
        <span>{Math.round(nwPercent)}% Equity</span>
        <span>Total Assets: ${safeAssets.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        <span>{Math.round(debtPercent)}% Debt</span>
      </div>
    </div>
  );
}