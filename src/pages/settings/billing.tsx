import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Download, DollarSign, TrendingUp } from "lucide-react";

export default function Billing() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground">Manage your subscription and billing details</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Professional</div>
            <p className="text-xs text-muted-foreground">
              $99/month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Payment</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$99.00</div>
            <p className="text-xs text-muted-foreground">
              Due on Mar 1, 2025
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Method</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">•••• 4242</div>
            <p className="text-xs text-muted-foreground">
              Expires 12/25
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Details</CardTitle>
          <CardDescription>Your current plan and usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Professional Plan</p>
                  <p className="text-sm text-muted-foreground">$99/month</p>
                </div>
                <Badge>Active</Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium">Users</p>
                  <p className="text-2xl font-bold mt-2">25 / 50</p>
                  <p className="text-xs text-muted-foreground mt-1">50% of limit used</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium">Storage</p>
                  <p className="text-2xl font-bold mt-2">150GB / 500GB</p>
                  <p className="text-xs text-muted-foreground mt-1">30% of limit used</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>View and download past invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                date: "Mar 1, 2025",
                amount: "$99.00",
                status: "Upcoming",
                invoice: null
              },
              {
                date: "Feb 1, 2025",
                amount: "$99.00",
                status: "Paid",
                invoice: "INV-2025-002"
              },
              {
                date: "Jan 1, 2025",
                amount: "$99.00",
                status: "Paid",
                invoice: "INV-2025-001"
              }
            ].map((payment, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{payment.date}</p>
                  <p className="text-sm text-muted-foreground">{payment.amount}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={payment.status === "Paid" ? "default" : "secondary"}>
                    {payment.status}
                  </Badge>
                  {payment.invoice && (
                    <Download className="h-4 w-4 text-muted-foreground cursor-pointer" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}