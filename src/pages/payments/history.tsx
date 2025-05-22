import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function PaymentHistory() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>View all your past payments and transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">2025-01-15</TableCell>
                <TableCell>TXN-001</TableCell>
                <TableCell>Commission Payout</TableCell>
                <TableCell>$1,250.00</TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700">
                    Completed
                  </span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">2025-01-10</TableCell>
                <TableCell>TXN-002</TableCell>
                <TableCell>Referral Bonus</TableCell>
                <TableCell>$500.00</TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700">
                    Completed
                  </span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}