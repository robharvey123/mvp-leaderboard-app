export const chartTheme = {
  tickFormatter: (v: unknown) => String(v ?? ""),
  valueFormatter: (v: number) => (Number.isFinite(v) ? String(v) : "0"),
};
