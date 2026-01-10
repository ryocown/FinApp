import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const CATEGORY_COLORS = [
  'bg-red-500/10 text-red-400 border-red-500/20',
  'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'bg-lime-500/10 text-lime-400 border-lime-500/20',
  'bg-green-500/10 text-green-400 border-green-500/20',
  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'bg-teal-500/10 text-teal-400 border-teal-500/20',
  'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'bg-sky-500/10 text-sky-400 border-sky-500/20',
  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
  'bg-pink-500/10 text-pink-400 border-pink-500/20',
  'bg-rose-500/10 text-rose-400 border-rose-500/20',
];

export function getCategoryColor(category: string | undefined | null): string {
  if (!category) return 'bg-zinc-800 text-zinc-400 border-zinc-700';

  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[index];
}
