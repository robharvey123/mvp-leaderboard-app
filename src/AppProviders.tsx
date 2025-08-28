import React from "react";
import { AuthProvider } from "@/context/auth-context";
import OrgProvider from "@/context/OrgContext";
import OrgTheme from "@/context/OrgTheme";
import { FilterProvider } from "@/context/FilterContext";
import { ToastProvider } from "@/components/Toast";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <OrgProvider>
        <OrgTheme>
          <FilterProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </FilterProvider>
        </OrgTheme>
      </OrgProvider>
    </AuthProvider>
  );
}
