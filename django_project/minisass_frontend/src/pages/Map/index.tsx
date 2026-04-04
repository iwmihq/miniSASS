import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Img } from "../../components";
import Sidebar from "../../components/Sidebar";
import { Map } from "../../components/Map";
import AuthenticationButtons from "../../components/AuthenticationButtons";

import Search from "./Search";
import basemapsData from "./config/basemaps.config.json";
import overlayLayersData from "./config/overlay.config.json";
import { useAuth, OPEN_LOGIN_MODAL } from "../../AuthContext";
import { globalVariables } from "../../utils";

import "./style.css";

// ── Legend Data ──
const LEGEND_ITEMS = [
  { icon: "img_alarm.svg", label: "Unmodified (NATURAL condition)" },
  { icon: "img_alarm_green_400.svg", label: "Largely natural / few modifications (GOOD)" },
  { icon: "img_alarm_orange_a200.svg", label: "Moderately modified (FAIR)" },
  { icon: "img_twitter.svg", label: "Largely modified (POOR)" },
  { icon: "img_alarm_deep_purple_400.svg", label: "Seriously / critically modified (VERY POOR)" },
  { icon: "img_settings.svg", label: "No groups present" },
  { icon: "img_arrowdown.svg", label: "Exclamation mark: unverified" },
];

const MapPage: React.FC = () => {
  const mapRef = useRef(null);
  const { dispatch, state } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const details = searchParams.get("details");
  const open_add_record = searchParams.get("open_add_record");

  // ── UI State ──
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isObservationDetails, setIsObservationDetails] = useState(false);
  const [isLoginFromThis, setIsLoginFromThis] = useState(false);
  const [idxActive, setIdxActive] = useState(open_add_record ? 1 : 0);
  const [isDisableNavigations, setIsDisableNavigations] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [selectingOnMap, setSelectingOnMap] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState({ latitude: null, longitude: null });
  const [siteWithObservations, setSiteWithObservations] = useState({ site: {}, observations: [] });
  const [siteDetails, setSiteDetailsFromApi] = useState({});
  const [resetMapToDefault, setResetMap] = useState(false);
  const [isSelectSiteOnMap, setIsSelectSiteOnMap] = useState(false);
  const [cursor, setCursor] = useState("");

  // ── Handlers ──
  const handleSidebarToggle = useCallback(() => {
    setIsObservationDetails(false);
    if (state.isAuthenticated) {
      setSidebarOpen((prev) => {
        if (!prev) setIdxActive(1);
        setIsDisableNavigations(!prev);
        return !prev;
      });
    } else {
      setIsLoginFromThis(true);
      dispatch({ type: OPEN_LOGIN_MODAL, payload: true });
    }
  }, [state.isAuthenticated, dispatch]);

  const handleMapClick = useCallback((latitude: number, longitude: number) => {
    setSelectedCoordinates({ latitude, longitude });
  }, []);

  const toggleMapSelection = useCallback(() => {
    setSelectingOnMap((prev) => !prev);
  }, []);

  const openObservationForm = useCallback(
    (data: { site: {}; observations: [] }) => {
      if (data.observations.length > 0 && !isSelectSiteOnMap) {
        setSiteWithObservations(data);
        setIsObservationDetails(true);
        setSidebarOpen(true);
        setSelectedCoordinates({
          latitude: (data.site as any).latitude,
          longitude: (data.site as any).longitude,
        });
      }
    },
    [isSelectSiteOnMap]
  );

  function resetMap(latitude: number | null = null, longitude: number | null = null): void {
    setSelectedCoordinates({ latitude, longitude });
    setResetMap(true);
  }

  function setSiteDetails(details: {}): void {
    if (isSelectSiteOnMap) setSiteDetailsFromApi(details);
  }

  function useSelectOnSite(isSelectOnSite: boolean): void {
    setIsSelectSiteOnMap(isSelectOnSite);
  }

  function resetSiteDetails(details: {}): void {
    setSiteDetailsFromApi(details);
  }

  // ── Effects ──
  useEffect(() => {
    if (state.isAuthenticated && isLoginFromThis) {
      setIdxActive(1);
      setSidebarOpen(true);
      setIsLoginFromThis(false);
    } else if (!state.isAuthenticated) {
      setSidebarOpen(false);
    }
  }, [state.isAuthenticated]);

  useEffect(() => {
    if (details) {
      window.scrollTo(0, 0);
      setIsObservationDetails(true);
      setSidebarOpen((prev) => !prev);
    } else if (open_add_record) {
      handleSidebarToggle();
    }
  }, [details, open_add_record]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!isSidebarOpen) setSelectedCoordinates({ latitude: null, longitude: null });
  }, [isSidebarOpen]);

  // ── Map URL state (shareable links) ──
  useEffect(() => {
    const mapInstance = mapRef.current?.getMap?.();
    if (!mapInstance) return;

    let timeout: ReturnType<typeof setTimeout>;
    const syncUrl = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const center = mapInstance.getCenter();
        const zoom = mapInstance.getZoom();
        const url = new URL(window.location.href);
        url.searchParams.set("lat", center.lat.toFixed(4));
        url.searchParams.set("lng", center.lng.toFixed(4));
        url.searchParams.set("z", zoom.toFixed(1));
        window.history.replaceState(null, "", url.toString());
      }, 500);
    };

    mapInstance.on("moveend", syncUrl);
    return () => {
      clearTimeout(timeout);
      mapInstance.off("moveend", syncUrl);
    };
  });

  return (
    <div className="relative flex h-screen w-full flex-col font-raleway">
      {/* ── Floating Navigation Bar ── */}
      <header className="absolute left-0 right-0 top-0 z-30 bg-surface/95 shadow-nav backdrop-blur-sm">
        <div className="mx-auto flex max-w-content items-center justify-between px-3 py-2 sm:px-4">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex flex-shrink-0 items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="miniSASS Home"
          >
            <Img
              className="h-10 w-auto object-contain sm:h-14"
              src={`${globalVariables.staticPath}img_minisasslogo1.png`}
              alt="miniSASS"
            />
            <Img
              className="hidden h-5 w-auto object-contain sm:inline sm:h-6 lg:h-7"
              src={`${globalVariables.staticPath}miniSASS_text.png`}
              alt="miniSASS"
            />
          </button>

          {/* Desktop nav links */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {[
              { label: "Home", path: "/" },
              { label: "How to", path: "/howto" },
              { label: "Map", path: "/map" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`rounded-lg px-3 py-1.5 text-body-sm font-extrabold uppercase tracking-wider transition-colors ${
                  item.path === "/map"
                    ? "bg-surface-muted text-primary"
                    : "text-primary hover:bg-surface-muted/50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Search + Add Record + Auth */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search — hidden on mobile, shown on sm+ */}
            <div className="hidden sm:block sm:w-64">
              <Search searchEntityChanged={(geojson: any) => mapRef?.current?.updateHighlighGeojson(geojson)} />
            </div>
            {/* Search icon — mobile only, toggles search overlay */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-surface-muted sm:hidden"
              aria-label="Search"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            <button
              onClick={handleSidebarToggle}
              className="flex items-center gap-1.5 sm:gap-2 rounded-tr-xl rounded-bl-xl rounded-br-xl bg-accent px-3 sm:px-4 py-2 sm:py-2.5 text-body-sm font-semibold text-text-inverse shadow-card transition-all hover:bg-accent-dark hover:shadow-card-hover"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Add Record</span>
            </button>

            <div className="hidden sm:block">
              <AuthenticationButtons isDisableNavigations={isDisableNavigations} />
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile search overlay ── */}
      {mobileSearchOpen && (
        <div className="absolute left-0 right-0 top-[60px] z-30 bg-surface/95 px-3 py-2 shadow-md backdrop-blur-sm sm:hidden">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Search searchEntityChanged={(geojson: any) => { mapRef?.current?.updateHighlighGeojson(geojson); setMobileSearchOpen(false); }} />
            </div>
            <button
              onClick={() => setMobileSearchOpen(false)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-primary hover:bg-surface-muted"
              aria-label="Close search"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Map (fills entire viewport behind everything) ── */}
      <div className="absolute inset-0">
        <Map
          basemaps={basemapsData.map((data) => ({ name: data.name, config: data }))}
          overlayLayers={overlayLayersData.map((data: any) => ({
            name: data.name,
            activeByDefault: data.activeByDefault,
            config: data,
          }))}
          ref={mapRef}
          handleSelect={handleMapClick}
          selectingOnMap={selectingOnMap}
          selectedCoordinates={selectedCoordinates}
          resetMap={resetMapToDefault}
          idxActive={idxActive}
          setIdxActive={setIdxActive}
          openObservationForm={openObservationForm}
          setSiteDetails={setSiteDetails}
          cursor={cursor}
          isSelectSiteOnMap={isSelectSiteOnMap}
        />
      </div>

      {/* ── Floating Controls (left side) ── */}
      <div className="absolute bottom-24 left-3 z-30 flex flex-col gap-2 sm:bottom-8 sm:left-4">
        {/* Reset / Home */}
        <button
          onClick={() => resetMap(-28.671882886975247, 24.679864950000024)}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface shadow-card transition-all hover:shadow-card-hover"
          aria-label="Reset map view"
          title="Reset map view"
        >
          <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>

        {/* Legend toggle */}
        <button
          onClick={() => setShowLegend((p) => !p)}
          className={`flex h-10 w-10 items-center justify-center rounded-lg shadow-card transition-all hover:shadow-card-hover ${
            showLegend ? "bg-primary text-text-inverse" : "bg-surface text-primary"
          }`}
          aria-label="Toggle legend"
          title="Toggle legend"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </button>

        {/* Fullscreen toggle */}
        <button
          onClick={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen();
            } else {
              document.documentElement.requestFullscreen?.();
            }
          }}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface shadow-card transition-all hover:shadow-card-hover"
          aria-label="Toggle fullscreen"
          title="Toggle fullscreen"
        >
          <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>

      {/* ── Legend Panel ── */}
      <div
        className={`absolute bottom-24 left-14 z-30 w-72 rounded-tr-xl rounded-bl-xl rounded-br-xl bg-surface p-4 shadow-card transition-all duration-200 sm:bottom-8 sm:left-16 ${
          showLegend ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        <h3 className="mb-3 text-body-sm font-bold uppercase tracking-wider text-primary">Legend</h3>
        <div className="flex flex-col gap-2">
          {LEGEND_ITEMS.map((item) => (
            <div key={item.icon} className="flex items-center gap-2.5">
              <Img className="h-5 w-6 flex-shrink-0" src={`${globalVariables.staticPath}${item.icon}`} alt="" />
              <span className="text-caption leading-snug text-text">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sidebar ── */}
      <div
        className={`absolute bottom-0 right-0 top-0 z-40 w-full bg-surface shadow-card transition-transform duration-300 ease-in-out sm:w-[580px] ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <Sidebar
          isOpen={isSidebarOpen}
          isObservationDetails={isObservationDetails}
          setSidebarOpen={setSidebarOpen}
          observation={details}
          toggleMapSelection={toggleMapSelection}
          selectingOnMap={selectingOnMap}
          handleMapClick={handleMapClick}
          selectedCoordinates={selectedCoordinates}
          siteWithObservations={siteWithObservations}
          siteDetails={siteDetails}
          resetSiteDetails={resetSiteDetails}
          resetMap={resetMap}
          setCursor={setCursor}
          useSelectOnSite={useSelectOnSite}
          setIsDisableNavigations={setIsDisableNavigations}
        />
      </div>
    </div>
  );
};

export default MapPage;
