import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StatCard({ title, value, children }: { title: string; value?: string | number; children?: React.ReactNode; }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-base text-muted-foreground">{title}</CardTitle>
        {value !== undefined && (
          <div className="text-3xl font-semibold tracking-tight">{value}</div>
        )}
      </CardHeader>
      {children && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  );
}