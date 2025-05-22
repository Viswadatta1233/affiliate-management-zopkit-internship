import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, AlertTriangle } from "lucide-react";

export default function FraudMonitoring() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Fraud Monitoring</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Risk Score</CardTitle>
            <CardDescription>Overall system risk assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">Low</div>
            <p className="text-sm text-muted-foreground mt-2">
              Based on current activity patterns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Active Alerts</CardTitle>
            <CardDescription>Pending investigation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-amber-600">2</div>
            <p className="text-sm text-muted-foreground mt-2">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Blocked Attempts</CardTitle>
            <CardDescription>Last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-red-600">5</div>
            <p className="text-sm text-muted-foreground mt-2">
              Suspicious activities prevented
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>System Status</AlertTitle>
          <AlertDescription>
            Fraud detection system is actively monitoring all transactions
          </AlertDescription>
        </Alert>

        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Recent Detection</AlertTitle>
          <AlertDescription>
            Unusual activity detected from IP range 192.168.1.x
          </AlertDescription>
        </Alert>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest suspicious activities detected by the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                time: "2 hours ago",
                event: "Multiple failed login attempts",
                severity: "Medium",
                status: "Investigating",
              },
              {
                time: "5 hours ago",
                event: "Unusual transaction pattern detected",
                severity: "High",
                status: "Blocked",
              },
              {
                time: "1 day ago",
                event: "IP address blacklisted",
                severity: "Low",
                status: "Resolved",
              },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <p className="font-medium">{activity.event}</p>
                  <p className="text-sm text-muted-foreground">{activity.time}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      activity.severity === "High"
                        ? "bg-red-100 text-red-800"
                        : activity.severity === "Medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {activity.severity}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      activity.status === "Blocked"
                        ? "bg-red-100 text-red-800"
                        : activity.status === "Investigating"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {activity.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}