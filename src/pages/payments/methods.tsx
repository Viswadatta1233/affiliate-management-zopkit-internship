import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';

export default function PaymentMethods() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [methodType, setMethodType] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Handle payment method creation
    toast({
      title: "Payment Method Added",
      description: `Added ${methodType} payment method`,
    });
    
    setIsDialogOpen(false);
    setMethodType('');
    setAccountNumber('');
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Methods</h1>
          <p className="text-muted-foreground">Manage your payment methods</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Payment Method
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
              <DialogDescription>
                Add a new payment method to receive your commissions.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="methodType">Payment Method Type</Label>
                <Select value={methodType} onValueChange={setMethodType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Bank Account</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="wise">Wise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number/Email</Label>
                <Input
                  id="accountNumber"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Enter account details"
                  required
                />
              </div>
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Method</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Payment Methods</CardTitle>
          <CardDescription>Configure how you want to receive payments</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No payment methods configured yet. Add a payment method to start receiving payments.</p>
        </CardContent>
      </Card>
    </div>
  );
}