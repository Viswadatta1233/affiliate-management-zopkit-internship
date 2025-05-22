import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function FraudRules() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Fraud Rules</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Fraud Prevention Rules
          </CardTitle>
          <CardDescription>
            Configure and manage rules to automatically detect and prevent fraudulent affiliate activities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Configure your fraud prevention rules here. This feature is coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}