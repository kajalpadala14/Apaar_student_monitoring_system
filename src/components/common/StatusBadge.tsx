import React from 'react';

interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, size = 'sm' }) => {
  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-300';
  let dotColor = 'bg-slate-400';

  const normalized = (status || '').toUpperCase();

  if (normalized === 'GREEN' || normalized === 'COMPLETED' || normalized === 'GENERATED' || normalized === 'YES') {
    colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    dotColor = 'bg-emerald-600';
  } else if (normalized === 'YELLOW' || normalized === 'MEDIUM') {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
    dotColor = 'bg-amber-500';
  } else if (normalized === 'PENDING') {
    colorClasses = 'bg-orange-50 text-orange-800 border-orange-200';
    dotColor = 'bg-orange-500';
  } else if (normalized === 'RED' || normalized === 'CRITICAL' || normalized === 'NO') {
    colorClasses = 'bg-rose-50 text-rose-800 border-rose-200';
    dotColor = 'bg-rose-600';
  } else if (normalized === 'HIGH') {
    colorClasses = 'bg-orange-50 text-orange-800 border-orange-300';
    dotColor = 'bg-orange-600';
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${padding} ${colorClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      {label || status}
    </span>
  );
};
