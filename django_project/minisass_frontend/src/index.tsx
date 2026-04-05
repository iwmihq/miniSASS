import React from "react";
import "./styles/color.css";
import "./styles/font.css";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./styles/index.css";
import "./styles/tailwind.css";
import { AuthProvider } from "./AuthContext";
import { PrivacyConsentProvider } from "./PrivacyConsentContext";
import { queryClient } from "./lib/query-client";
import ErrorBoundary from "./components/ErrorBoundary";

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <PrivacyConsentProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </PrivacyConsentProvider>
    </QueryClientProvider>
  </ErrorBoundary>,
);
