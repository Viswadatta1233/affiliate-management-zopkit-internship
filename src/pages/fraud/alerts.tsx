import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bell, Shield, AlertTriangle } from "lucide-react";

export default function FraudAlerts() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fraud Alerts</h1>
          <p className="text-muted-foreground">Monitor and manage potential fraud alerts</p>
        </div>
        <Bell className="h-8 w-8 text-muted-foreground" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +2 since last check
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              +3 from yesterday
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
          <CardDescription>
            Latest detected suspicious activities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Multiple Failed Login Attempts</AlertTitle>
            <AlertDescription>
              10 failed login attempts detected from IP 192.168.1.1
            </AlertDescription>
          </Alert>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Unusual Traffic Pattern</AlertTitle>
            <AlertDescription>
              Spike in traffic detected from unverified sources
            </AlertDescription>
          </Alert>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Suspicious Transaction Pattern</AlertTitle>
            <AlertDescription>
              Multiple small transactions followed by large withdrawal attempt
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}