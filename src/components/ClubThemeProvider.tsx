// src/components/ClubThemeProvider.tsx
import { useOrg } from "@/context/OrgContext";

export default function ClubThemeProvider({ children }: { children: React.ReactNode }) {
  const { org } = useOrg();
  const brand = (org?.brand as any) || {};
  const style: React.CSSProperties = {
    ["--brand-primary" as any]: brand.primary || "#0ea5e9",
    ["--brand-secondary" as any]: brand.secondary || "#10b981",
  };
  return <div style={style}>{children}</div>;
}
