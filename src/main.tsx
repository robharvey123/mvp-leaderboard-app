import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";

/* App providers (adjust imports if your paths differ) */
import { AuthProvider } from "@/context/auth-context";
import { OrgProvider } from "@/context/OrgContext";
import OrgTheme from "@/context/OrgTheme";
import { FilterProvider } from "@/context/FilterContext";
import ErrorBoundary from "@/components/ErrorBoundary";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <OrgProvider>
          <OrgTheme>
            <FilterProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </FilterProvider>
          </OrgTheme>
        </OrgProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
