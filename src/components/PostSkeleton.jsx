import React from "react";

export default function PostSkeleton({ index = 0 }) {
  return (
    <div 
      className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-2xs flex gap-3.5 animate-fade-in-up"
      style={{ animationDelay: `${Math.min(index * 100, 300)}ms` }}
    >
      {/* Avatar Skeleton */}
      <div className="shrink-0">
        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-zinc-800 animate-pulse" />
      </div>

      {/* Content Skeleton */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        {/* Header: Name & Time */}
        <div className="flex flex-col gap-1.5">
          <div className="w-32 h-3.5 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" style={{ animationDelay: `${index * 50 + 100}ms` }} />
          <div className="w-20 h-2.5 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" style={{ animationDelay: `${index * 50 + 150}ms` }} />
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <div className="w-full h-3 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" style={{ animationDelay: `${index * 50 + 200}ms` }} />
          <div className="w-full h-3 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" style={{ animationDelay: `${index * 50 + 250}ms` }} />
          <div className="w-3/4 h-3 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" style={{ animationDelay: `${index * 50 + 300}ms` }} />
        </div>

        {/* Media Frame Skeleton */}
        <div className="w-full h-48 sm:h-64 rounded-2xl bg-slate-200 dark:bg-zinc-800 animate-pulse" style={{ animationDelay: `${index * 50 + 350}ms` }} />

        {/* Interaction Row Skeleton */}
        <div className="flex items-center justify-between pt-2 px-2">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800 animate-pulse" style={{ animationDelay: `${index * 50 + 400}ms` }} />
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800 animate-pulse" style={{ animationDelay: `${index * 50 + 450}ms` }} />
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800 animate-pulse" style={{ animationDelay: `${index * 50 + 500}ms` }} />
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800 animate-pulse" style={{ animationDelay: `${index * 50 + 550}ms` }} />
        </div>
      </div>
    </div>
  );
}
