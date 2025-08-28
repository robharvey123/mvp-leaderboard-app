import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export type MiniSeries = { date: string; bat: number; bowl: number; field: number; total: number }[];

export default function PlayerMiniModal({
  open,
  onOpenChange,
  name,
  series,
  split: { bat, bowl, field, total },
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  name: string;
  series: MiniSeries;
  split: { bat: number; bowl: number; field: number; total: number };
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Total Points (by match)</h3>
              <div className="h-40">
                <ResponsiveContainer>
                  <LineChart data={series} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" hide />
                    <YAxis hide />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-4">
            <Card className="rounded-2xl"><CardContent className="p-4"><div className="text-sm text-muted-foreground">Batting</div><div className="text-2xl font-semibold">{Math.round(bat)}</div><div className="h-16 mt-2"><ResponsiveContainer><LineChart data={series}><Line type="monotone" dataKey="bat" dot={false} /></LineChart></ResponsiveContainer></div></CardContent></Card>
            <Card className="rounded-2xl"><CardContent className="p-4"><div className="text-sm text-muted-foreground">Bowling</div><div className="text-2xl font-semibold">{Math.round(bowl)}</div><div className="h-16 mt-2"><ResponsiveContainer><LineChart data={series}><Line type="monotone" dataKey="bowl" dot={false} /></LineChart></ResponsiveContainer></div></CardContent></Card>
            <Card className="rounded-2xl"><CardContent className="p-4"><div className="text-sm text-muted-foreground">Fielding</div><div className="text-2xl font-semibold">{Math.round(field)}</div><div className="h-16 mt-2"><ResponsiveContainer><LineChart data={series}><Line type="monotone" dataKey="field" dot={false} /></LineChart></ResponsiveContainer></div></CardContent></Card>
          </div>
        </div>
        <div className="text-right text-sm text-muted-foreground">Total: {Math.round(total)}</div>
      </DialogContent>
    </Dialog>
  );
}