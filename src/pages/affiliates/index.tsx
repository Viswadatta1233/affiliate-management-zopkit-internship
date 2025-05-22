import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Users, DollarSign, TrendingUp, Link2, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Affiliates() {
  const [email, setEmail] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<string | null>(null);
  const { toast } = useToast();

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: "Invitation Sent",
      description: `An invitation has been sent to ${email}`,
    });
    
    setIsDialogOpen(false);
    setEmail('');
  };

  // Sample affiliate data
  const affiliates = [
    {
      id: '1',
      name: 'Jane Smith',
      email: 'jane@example.com',
      status: 'active',
      joinDate: '2025-01-15',
      earnings: 3675,
      sales: 24500,
      referralCode: 'JANE2025',
      clicks: 1256,
      conversions: 85,
      conversionRate: '6.77%',
      activeLinks: 5,
      paymentMethod: 'PayPal',
      lastPayout: '2025-02-01',
      nextPayout: '2025-03-01',
      tier: 'Gold'
    },
    {
      id: '2',
      name: 'Alex Johnson',
      email: 'alex@example.com',
      status: 'active',
      joinDate: '2025-02-01',
      earnings: 2812.50,
      sales: 18750,
      referralCode: 'ALEX2025',
      clicks: 856,
      conversions: 62,
      conversionRate: '7.24%',
      activeLinks: 3,
      paymentMethod: 'Bank Transfer',
      lastPayout: '2025-02-01',
      nextPayout: '2025-03-01',
      tier: 'Silver'
    },
    {
      id: '3',
      name: 'Lisa Brown',
      email: 'lisa@example.com',
      status: 'active',
      joinDate: '2025-02-15',
      earnings: 2280,
      sales: 15200,
      referralCode: 'LISA2025',
      clicks: 723,
      conversions: 45,
      conversionRate: '6.22%',
      activeLinks: 4,
      paymentMethod: 'Wise',
      lastPayout: '2025-02-01',
      nextPayout: '2025-03-01',
      tier: 'Bronze'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Affiliates</h1>
          <p className="text-muted-foreground">Manage your affiliate partners</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Invite Affiliate
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Invite New Affiliate</DialogTitle>
              <DialogDescription>
                Send an invitation to a new affiliate to join your program.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInviteSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="affiliate@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tier">Initial Tier</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bronze">Bronze</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="commission">Commission Rate (%)</Label>
                  <Input
                    id="commission"
                    type="number"
                    placeholder="10"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Send Invitation</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Affiliate Partners</CardTitle>
          <CardDescription>View and manage your affiliate partners</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {affiliates.map((affiliate) => (
              <div 
                key={affiliate.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" />
                    <AvatarFallback>{affiliate.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{affiliate.name}</h3>
                    <p className="text-sm text-muted-foreground">{affiliate.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">${affiliate.earnings.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                  </div>
                  <Badge variant={affiliate.status === 'active' ? 'default' : 'secondary'}>
                    {affiliate.status}
                  </Badge>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/affiliates/${affiliate.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Profile
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}