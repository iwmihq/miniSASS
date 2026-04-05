import React, { useEffect, useState } from "react";
import ReactGA from "react-ga4";
import Routes from "./Routes";
import Tooltip from '@mui/material/Tooltip';
import PrivacyConsentModal from "./components/PrivacyConsentModal"
import { usePrivacyConsent, CLOSE_PRIVACY_MODAL } from './PrivacyConsentContext';

// Declare global gtranslateSettings for TypeScript
declare global {
  interface Window {
    gtranslateSettings: any;
  }
}

function App() {
  const { state, dispatch } = usePrivacyConsent();

  useEffect(() => {
    const startTime = Date.now();

    const handleBeforeUnload = () => {
      const duration = (Date.now() - startTime) / 1000;
      ReactGA.event("session_duration", {
        session_length_seconds: duration,
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    // Protect the page title from translation
    const ORIGINAL_TITLE = document.title || 'miniSASS';

    // Function to restore title
    const restoreTitle = () => {
      if (document.title !== ORIGINAL_TITLE) {
        document.title = ORIGINAL_TITLE;
      }
    };

    // Set title attributes to prevent translation
    const titleElement = document.querySelector('title');
    if (titleElement) {
      titleElement.classList.add('notranslate');
      titleElement.setAttribute('translate', 'no');
    }

    // Configure GTranslate settings before loading the script
    window.gtranslateSettings = {
      "default_language": "en",
      "languages": ["en", "zu", "af", "pt", "xh", "st", "fr", "es", "de"],
      "wrapper_selector": ".gtranslate_wrapper",
      "switcher_horizontal_position": "left",
      "switcher_vertical_position": "bottom",
      "flag_style": "2d",
      "flag_size": 20,
      "alt_flags": {
        "en": "usa"
      }
    };

    // Load GTranslate script
    const script = document.createElement('script');
    script.src = 'https://cdn.gtranslate.net/widgets/latest/float.js';
    script.async = true;
    script.defer = true;

    // Add error handling
    script.onerror = () => {
      console.error('Failed to load GTranslate widget');
    };

    document.head.appendChild(script);

    // Monitor for title changes and restore if translated
    const titleInterval = setInterval(restoreTitle, 2000);

    // Monitor DOM changes to the title
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.target === titleElement) {
          restoreTitle();
        }
      });
    });

    if (titleElement) {
      observer.observe(titleElement, { childList: true, subtree: true });
    }

    // Cleanup function
    return () => {
      clearInterval(titleInterval);
      observer.disconnect();
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <>
      {/* GTranslate wrapper - the widget will be injected here */}
      <div className="gtranslate_wrapper"></div>
      {/* Translation attribution */}
      <Tooltip
        title="Please be aware that the translations done by this tool are automatic. They are not verified by the miniSASS team and may not be completely accurate."
        placement="right-start"
      >
        <div style={{
          position: 'fixed',
          bottom: '10px',
          left: '10px',
          fontSize: '0.7rem',
          color: '#666',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '2px 6px',
          borderRadius: '3px',
          zIndex: 1000
        }}>
          Translations by GTranslate
        </div>
      </Tooltip>

      <PrivacyConsentModal
        open={state.isPrivacyModalOpen}
        onClose={() => dispatch({ type: CLOSE_PRIVACY_MODAL })}
      />
      <Routes />
    </>
  );
}

export default App;
