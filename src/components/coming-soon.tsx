import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction, Clock } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
  features: string[];
}

export function ComingSoon({ title, description, features }: ComingSoonProps) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center py-16 animate-fade-in">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-warning/10">
        <Construction className="h-10 w-10 text-warning" />
      </div>
      <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      <p className="mt-2 max-w-md text-center text-muted-foreground">{description}</p>

      <div className="mt-8 w-full">
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Prochainement dans cette étape</h3>
            </div>
            <ul className="space-y-2.5">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                  {f}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Badge variant="warning" className="mt-6">
        Module en préparation
      </Badge>
    </div>
  );
}
