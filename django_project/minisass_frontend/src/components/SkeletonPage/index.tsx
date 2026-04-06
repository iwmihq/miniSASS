import React from "react";

/** Pulse-animated skeleton block */
const Bone: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`animate-pulse rounded-lg bg-surface-muted ${className}`} />
);

/** Full-page skeleton shown while lazy routes load */
const SkeletonPage: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-surface font-raleway">
      {/* Fake header */}
      <div className="sticky top-0 z-40 bg-surface shadow-nav">
        <div className="mx-auto flex max-w-content items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
          <Bone className="h-14 w-32" />
          <div className="hidden gap-2 md:flex">
            <Bone className="h-8 w-16" />
            <Bone className="h-8 w-16" />
            <Bone className="h-8 w-16" />
            <Bone className="h-8 w-20" />
          </div>
          <Bone className="h-8 w-24" />
        </div>
      </div>

      {/* Hero skeleton */}
      <Bone className="h-64 w-full rounded-none sm:h-80" />

      {/* Content skeleton */}
      <div className="mx-auto mt-8 w-full max-w-content space-y-6 px-4 sm:px-6 lg:px-8">
        <Bone className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Bone className="h-24" />
          <Bone className="h-24" />
          <Bone className="h-24" />
          <Bone className="h-24" />
        </div>
        <Bone className="mt-8 h-6 w-64" />
        <Bone className="h-40 w-full" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Bone key={i} className="h-48" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkeletonPage;
