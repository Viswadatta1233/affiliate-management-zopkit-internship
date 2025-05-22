import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Key, Shield, Clock } from "lucide-react";

export default function ApiKeys() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground">Manage your API keys and access tokens</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Currently in use
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Level</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">High</div>
            <p className="text-xs text-muted-foreground">
              All keys using latest encryption
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Rotation</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15 days</div>
            <p className="text-xs text-muted-foreground">
              Until scheduled key rotation
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Manage your API keys and their permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                name: "Production API Key",
                key: "sk_prod_...3fa8",
                created: "2025-01-15",
                status: "active",
                environment: "production"
              },
              {
                name: "Staging API Key",
                key: "sk_stage_...9bc2",
                created: "2025-02-01",
                status: "active",
                environment: "staging"
              },
              {
                name: "Development API Key",
                key: "sk_dev_...5df4",
                created: "2025-02-15",
                status: "active",
                environment: "development"
              }
            ].map((apiKey, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{apiKey.name}</p>
                    <Badge variant={
                      apiKey.environment === "production" ? "default" :
                      apiKey.environment === "staging" ? "secondary" :
                      "outline"
                    }>
                      {apiKey.environment}
                    </Badge>
                  </div>
                  <p className="font-mono text-sm text-muted-foreground">{apiKey.key}</p>
                  <p className="text-xs text-muted-foreground">Created on {apiKey.created}</p>
                </div>
                <Badge variant={apiKey.status === "active" ? "default" : "secondary"}>
                  {apiKey.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}