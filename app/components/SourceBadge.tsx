'use client';

/**
 * SourceBadge — Indicates where data comes from.
 * Used throughout the insight panels to build trust.
 */

const CONFIG: Record<string, { label: string; dotColor: string; textColor: string }> = {
  user_data:         { label: 'Measured',  dotColor: 'bg-emerald-400', textColor: 'text-emerald-600' },
  computed:          { label: 'Calculated', dotColor: 'bg-blue-400',   textColor: 'text-blue-600' },
  ai_estimate:       { label: 'AI Est.',    dotColor: 'bg-amber-400',  textColor: 'text-amber-600' },
  ai_interpretation: { label: 'AI',         dotColor: 'bg-purple-400', textColor: 'text-purple-600' },
};

export default function SourceBadge({ source }: { source: string }) {
  const cfg = CONFIG[source] || CONFIG.computed!;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${cfg.textColor}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
      {cfg.label}
    </span>
  );
}
