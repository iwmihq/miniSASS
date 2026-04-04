import ReactGA from "react-ga4";

let gaInitialized = false;

export const initGA = () => {
  if (typeof GOOGLE_ANALYTICS_TRACKING_CODE !== "undefined" && GOOGLE_ANALYTICS_TRACKING_CODE) {
    ReactGA.initialize(GOOGLE_ANALYTICS_TRACKING_CODE);
    gaInitialized = true;
  }
};

export const trackPageView = (path: string) => {
  if (!gaInitialized) return;
  ReactGA.event("page_view", {
    page_location: window.location.href,
    page_path: path,
    page_title: document.title,
  });
};
