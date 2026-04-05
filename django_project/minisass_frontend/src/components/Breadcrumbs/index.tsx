import React from "react";
import { Link, useLocation } from "react-router-dom";

const ROUTE_LABELS: Record<string, string> = {
  "": "Home",
  home: "Home",
  howto: "How To",
  map: "Map",
  "privacy-policy": "Privacy Policy",
  "password-reset": "Password Reset",
  "recent-activity": "Recent Activity",
  "mobile-app": "Mobile App",
};

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  // Don't show breadcrumbs on the home page
  if (segments.length === 0 || (segments.length === 1 && segments[0] === "home")) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mx-auto max-w-content px-4 py-3 sm:px-6 lg:px-8">
      <ol className="flex items-center gap-1 text-body-sm text-text-muted">
        <li>
          <Link to="/" className="transition-colors hover:text-primary">Home</Link>
        </li>
        {segments.map((segment, idx) => {
          const path = "/" + segments.slice(0, idx + 1).join("/");
          const isLast = idx === segments.length - 1;
          const label = ROUTE_LABELS[segment] || segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

          return (
            <li key={path} className="flex items-center gap-1">
              <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              {isLast ? (
                <span className="font-medium text-primary" aria-current="page">{label}</span>
              ) : (
                <Link to={path} className="transition-colors hover:text-primary">{label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
