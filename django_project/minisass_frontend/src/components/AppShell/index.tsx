import React, { useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Img } from "../../components";
import AuthenticationButtons from "../AuthenticationButtons";
import ContactFormModal from "../ContactFormModal";
import ConfirmationDialogRaw from "../ConfirmationDialog";
import Footer from "../Footer";
import Breadcrumbs from "../Breadcrumbs";
import SearchBar from "../SearchBar";
import { globalVariables } from "../../utils";
import { ContactFormData } from "../ContactFormModal/types";

interface AppShellProps {
  children: React.ReactNode;
  activePage?: string;
  /** Hide header/footer for full-screen pages like the map */
  fullScreen?: boolean;
  /** Show partner logos in footer */
  showFooterLogos?: boolean;
  /** Whether unsaved data should trigger nav confirmation */
  isDisableNavigations?: boolean;
}

const NAV_ITEMS = [
  { label: "Home", path: "/", key: "home" },
  { label: "How to", path: "/howto", key: "howto" },
  { label: "Map", path: "/map", key: "map" },
  { label: "Contact us", path: "contact", key: "contact" },
] as const;

export default function AppShell({
  children,
  activePage,
  fullScreen = false,
  showFooterLogos = true,
  isDisableNavigations = false,
}: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingNav, setPendingNav] = useState("/");

  // Derive active page from URL if not provided
  const active = activePage || (() => {
    const p = location.pathname;
    if (p === "/" || p === "/home") return "home";
    if (p.startsWith("/howto")) return "howto";
    if (p.startsWith("/map")) return "map";
    return "";
  })();

  const handleNav = useCallback(
    (path: string) => {
      if (path === "contact") {
        setContactModalOpen(true);
        setMobileMenuOpen(false);
        return;
      }
      if (isDisableNavigations) {
        setPendingNav(path);
        setConfirmDialogOpen(true);
        setMobileMenuOpen(false);
        return;
      }
      navigate(path);
      setMobileMenuOpen(false);
    },
    [isDisableNavigations, navigate]
  );

  const handleConfirmNav = () => {
    setConfirmDialogOpen(false);
    navigate(pendingNav);
  };

  if (fullScreen) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface font-raleway">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-surface shadow-nav">
        <div className="mx-auto flex max-w-content items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
          {/* Logo + wordmark */}
          <button
            onClick={() => handleNav("/")}
            className="flex flex-shrink-0 items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="miniSASS Home"
          >
            <Img
              className="h-14 w-auto object-contain sm:h-16"
              src={`${globalVariables.staticPath}img_minisasslogo1.png`}
              alt="miniSASS"
            />
            <Img
              className="hidden h-6 w-auto object-contain sm:inline sm:h-7 lg:h-8"
              src={`${globalVariables.staticPath}miniSASS_text.png`}
              alt="miniSASS"
            />
          </button>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNav(item.path)}
                className={`rounded-lg px-4 py-2 text-body-sm font-extrabold uppercase tracking-wider transition-colors
                  ${active === item.key
                    ? "bg-surface-muted text-primary"
                    : "text-primary hover:bg-surface-muted/50"
                  }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right side: search icon + auth buttons + download + mobile hamburger */}
          <div className="flex items-center gap-2">
            {/* Search — desktop */}
            <div className="hidden md:block">
              <SearchBar />
            </div>
            {/* Auth buttons (login/register/user menu) */}
            <div className="hidden sm:block">
              <AuthenticationButtons isDisableNavigations={isDisableNavigations} />
            </div>

            {/* Download app button — desktop only */}
            <button
              onClick={() => handleNav("/mobile-app")}
              className="hidden rounded-l-2xl bg-primary px-4 py-2 text-body-sm font-semibold text-text-inverse transition-colors hover:bg-primary-dark lg:block"
            >
              Download miniSASS App
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-primary hover:bg-surface-muted md:hidden"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-surface-muted bg-surface px-4 pb-4 pt-2 md:hidden">
            {/* Mobile search */}
            <div className="mb-3 lg:hidden">
              <SearchBar />
            </div>
            <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleNav(item.path)}
                  className={`rounded-lg px-4 py-3 text-left text-body-sm font-extrabold uppercase tracking-wider transition-colors
                    ${active === item.key
                      ? "bg-surface-muted text-primary"
                      : "text-primary hover:bg-surface-muted/50"
                    }`}
                >
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => handleNav("/mobile-app")}
                className="mt-2 rounded-lg bg-primary px-4 py-3 text-left text-body-sm font-semibold text-text-inverse"
              >
                Download miniSASS App
              </button>
              {/* Auth on mobile */}
              <div className="mt-2 sm:hidden">
                <AuthenticationButtons isDisableNavigations={isDisableNavigations} />
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ── Breadcrumbs ── */}
      <Breadcrumbs />

      {/* ── Main Content ── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <Footer
        className="mt-auto"
        showLogo={showFooterLogos}
      />

      {/* ── Modals ── */}
      <ContactFormModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        onSubmit={(data: ContactFormData) => setContactModalOpen(false)}
      />
      <ConfirmationDialogRaw
        id="nav-confirm-dialog"
        keepMounted
        value="navigate"
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleConfirmNav}
        title="Confirm Navigation"
        message="The data input form is open. Are you sure you want to navigate away? Any unsaved data will be lost."
      />
    </div>
  );
}
