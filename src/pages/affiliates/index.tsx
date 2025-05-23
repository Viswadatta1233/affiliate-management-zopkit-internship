import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAffiliateStore } from '@/store/affiliate-store';

// Invite Affiliate Form Component
const InviteAffiliateForm = ({ onClose }: { onClose: () => void }) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [initialTier, setInitialTier] = useState('');
  const [commissionRate, setCommissionRate] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { inviteAffiliate } = useAffiliateStore();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await inviteAffiliate({
        email,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        initialTier: initialTier || undefined,
        commissionRate: commissionRate || undefined
      });
      
      toast.success(`Invitation sent to ${email}`, {
        description: "An email with login credentials has been sent to the affiliate."
      });
      
      onClose();
    } catch (error) {
      toast.error('Failed to send invitation', {
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-1">Invite New Affiliate</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Send an invitation to a new affiliate to join your program.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address*</Label>
              <Input
                id="email"
                type="email"
                placeholder="affiliate@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="tier">Initial Tier</Label>
              <Select value={initialTier} onValueChange={setInitialTier}>
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
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value))}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-4 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function Affiliates() {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<string | null>(null);
  
  const { affiliates, fetchAffiliates, isLoading, error } = useAffiliateStore();
  
  useEffect(() => {
    fetchAffiliates();
  }, [fetchAffiliates]);

  // Sample affiliate data - replace with actual data from store when available
  const displayAffiliates = affiliates.length > 0 ? affiliates : [
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
        <Button onClick={() => setShowInviteForm(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Invite Affiliate
        </Button>
      </div>

      {/* Render invite form modal when showInviteForm is true */}
      {showInviteForm && <InviteAffiliateForm onClose={() => setShowInviteForm(false)} />}

      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          Error: {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Affiliate Partners</CardTitle>
          <CardDescription>View and manage your affiliate partners</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading affiliates...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {displayAffiliates.map((affiliate) => (
                <div 
                  key={affiliate.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" />
                      <AvatarFallback>
                        {affiliate.name 
                          ? affiliate.name.split(' ').map((n: string) => n[0]).join('') 
                          : affiliate.user?.firstName?.charAt(0) + (affiliate.user?.lastName?.charAt(0) || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">
                        {affiliate.name || `${affiliate.user?.firstName || ''} ${affiliate.user?.lastName || ''}`}
                      </h3>
                      <p className="text-sm text-muted-foreground">{affiliate.email || affiliate.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">${affiliate.earnings?.toLocaleString() || '0'}</p>
                      <p className="text-sm text-muted-foreground">Total Earnings</p>
                    </div>
                    <Badge variant={affiliate.status === 'active' ? 'default' : 'secondary'}>
                      {affiliate.status || 'pending'}
                    </Badge>
                    <Link to={`/affiliates/${affiliate.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}