import { Bug, Copy, FileText, Gauge, Network, Wand2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/common/components/ui/badge";

const SOON: { title: string; icon: LucideIcon }[] = [
  { title: "Explain architecture", icon: Network },
  { title: "Document code", icon: FileText },
  { title: "Detect bugs", icon: Bug },
  { title: "Find duplicate code", icon: Copy },
  { title: "Suggest refactoring", icon: Wand2 },
  { title: "Estimate tech debt", icon: Gauge },
];

/** De-emphasised strip of upcoming code-intelligence capabilities. */
export function Roadmap() {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground">On the roadmap</h2>
        <span className="text-xs text-muted-foreground">
          more coming to CodeAtlas
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SOON.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.title}
              className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-3 py-2.5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                {c.title}
              </span>
              <Badge variant="outline" className="ml-auto text-[10px]">
                Soon
              </Badge>
            </div>
          );
        })}
      </div>
    </section>
  );
}
