import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Webhook, Activity, CheckCircle, XCircle } from "lucide-react";

export default function Webhooks() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground">Manage your webhook endpoints and delivery settings</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Webhooks</CardTitle>
            <Webhook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              Currently configured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,248</div>
            <p className="text-xs text-muted-foreground">
              Webhook events triggered
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configured Webhooks</CardTitle>
          <CardDescription>Your webhook endpoints and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                url: "https://api.example.com/webhooks/orders",
                events: ["order.created", "order.updated"],
                status: "active",
                lastDelivery: "2 minutes ago",
                success: true
              },
              {
                url: "https://api.example.com/webhooks/customers",
                events: ["customer.created"],
                status: "active",
                lastDelivery: "15 minutes ago",
                success: true
              },
              {
                url: "https://api.example.com/webhooks/payments",
                events: ["payment.succeeded", "payment.failed"],
                status: "active",
                lastDelivery: "1 hour ago",
                success: false
              }
            ].map((webhook, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium font-mono text-sm">{webhook.url}</p>
                    <Badge variant={webhook.status === "active" ? "default" : "secondary"}>
                      {webhook.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {webhook.events.map((event, eventIndex) => (
                      <Badge key={eventIndex} variant="outline">
                        {event}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Last delivery: {webhook.lastDelivery}</span>
                    {webhook.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}