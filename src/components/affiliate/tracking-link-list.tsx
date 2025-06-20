import React, { useState } from 'react';
import { useAffiliateStore } from '@/store/affiliate-store';
import { useAuthStore } from '@/store/auth-store';
import { TrackingLink } from '@/types';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TrackingLinkForm } from './tracking-link-form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Copy, Edit2, Link2, MoreHorizontal, QrCode, Share2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TrackingLinkListProps {
  links: TrackingLink[];
  onRefresh: () => void;
}

export function TrackingLinkList({ links, onRefresh }: TrackingLinkListProps) {
  const { tenant } = useAuthStore();
  const { deleteTrackingLink, isLoading } = useAffiliateStore();
  const { toast } = useToast();
  
  const [selectedLink, setSelectedLink] = useState<TrackingLink | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showQrDialog, setShowQrDialog] = useState(false);

  // Copy tracking link to clipboard
  const copyToClipboard = (link: TrackingLink) => {
    const fullUrl = buildFullTrackingUrl(link);
    navigator.clipboard.writeText(fullUrl);
    toast({
      title: 'Link Copied',
      description: 'Tracking link copied to clipboard.',
    });
  };

  // Delete a tracking link
  const handleDelete = async () => {
    if (!selectedLink) return;
    
    try {
      await deleteTrackingLink(selectedLink.id);
      toast({
        title: 'Success',
        description: 'Tracking link deleted successfully.',
      });
      setShowDeleteDialog(false);
      onRefresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete tracking link.',
        variant: 'destructive',
      });
    }
  };

  // Open edit dialog
  const openEditDialog = (link: TrackingLink) => {
    setSelectedLink(link);
    setShowEditDialog(true);
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (link: TrackingLink) => {
    setSelectedLink(link);
    setShowDeleteDialog(true);
  };

  // Open QR code dialog
  const openQrDialog = (link: TrackingLink) => {
    setSelectedLink(link);
    setShowQrDialog(true);
  };

  // Build complete tracking URL from link data
  const buildFullTrackingUrl = (link: TrackingLink): string => {
    const baseUrl = link.destinationUrl;
    const queryParams = new URLSearchParams();
    
    queryParams.append('utm_source', link.utmSource);
    queryParams.append('utm_medium', link.utmMedium);
    
    if (link.utmCampaign) queryParams.append('utm_campaign', link.utmCampaign);
    if (link.utmContent) queryParams.append('utm_content', link.utmContent);
    if (link.utmTerm) queryParams.append('utm_term', link.utmTerm);
    
    // Add the query parameters to the URL
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}${queryParams.toString()}`;
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>;
      case 'paused':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Paused</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/20">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format URL for display
  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return `${urlObj.hostname}${urlObj.pathname.slice(0, 15)}${urlObj.pathname.length > 15 ? '...' : ''}`;
    } catch (e) {
      return url;
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tracking Links</CardTitle>
            <CardDescription>
              Manage your affiliate tracking links
            </CardDescription>
          </div>
          <Button variant="default" onClick={() => window.location.href = '/tracking-links/create'}>
            <Link2 className="mr-2 h-4 w-4" />
            Create New Link
          </Button>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium">No tracking links yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first tracking link to start promoting products.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card/List View */}
              <div className="block md:hidden">
                {links.map(link => (
                  <div key={link.id} className="mb-4 p-4 rounded-lg shadow bg-white">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold">{link.campaignName}</span>
                      {getStatusBadge(link.status)}
                    </div>
                    <div className="text-sm text-muted-foreground mb-1">Destination: {formatUrl(link.destinationUrl)}</div>
                    <div className="text-sm mb-1">Medium: {link.utmMedium}</div>
                    <div className="text-sm mb-1">Source: {link.utmSource}</div>
                    <div className="text-sm mb-1">Clicks: {link.clickCount} | Conversions: {link.conversionCount}</div>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={() => copyToClipboard(link)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="sm" onClick={() => openEditDialog(link)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" onClick={() => openQrDialog(link)}>
                        <QrCode className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openDeleteDialog(link)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Table View for md+ screens */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Medium</TableHead>
                      <TableHead className="hidden md:table-cell">Created</TableHead>
                      <TableHead className="hidden md:table-cell">Expires</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Stats</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {links.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell className="font-medium">{link.campaignName}</TableCell>
                        <TableCell>{formatUrl(link.destinationUrl)}</TableCell>
                        <TableCell>{link.utmMedium}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {format(new Date(link.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {link.expiresAt ? format(new Date(link.expiresAt), 'MMM d, yyyy') : 'Never'}
                        </TableCell>
                        <TableCell>{getStatusBadge(link.status)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{link.clickCount} clicks</span>
                            <span className="text-xs text-muted-foreground">{link.conversionCount} conversions</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => copyToClipboard(link)}>
                                <Copy className="mr-2 h-4 w-4" /> Copy Link
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openQrDialog(link)}>
                                <QrCode className="mr-2 h-4 w-4" /> QR Code
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.open(buildFullTrackingUrl(link), '_blank')}>
                                <Link2 className="mr-2 h-4 w-4" /> Open Link
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openEditDialog(link)}>
                                <Edit2 className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => openDeleteDialog(link)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {selectedLink && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Edit Tracking Link</DialogTitle>
              <DialogDescription>
                Update the details of your tracking link.
              </DialogDescription>
            </DialogHeader>
            <TrackingLinkForm 
              editLink={selectedLink}
              onSuccess={() => {
                setShowEditDialog(false);
                onRefresh();
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the tracking link
              and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Code Dialog */}
      {selectedLink && (
        <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>QR Code</DialogTitle>
              <DialogDescription>
                Scan this QR code to access your tracking link.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center p-4">
              {selectedLink.qrCodeUrl ? (
                <img 
                  src={selectedLink.qrCodeUrl} 
                  alt="QR Code" 
                  className="w-64 h-64"
                />
              ) : (
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(buildFullTrackingUrl(selectedLink))}`} 
                  alt="QR Code" 
                  className="w-64 h-64"
                />
              )}
              <div className="mt-4 text-center">
                <p className="text-sm font-medium">{selectedLink.campaignName}</p>
                <p className="text-xs text-muted-foreground mt-1">{buildFullTrackingUrl(selectedLink)}</p>
              </div>
              <div className="flex mt-4 space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const qrUrl = selectedLink.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(buildFullTrackingUrl(selectedLink))}`;
                    window.open(qrUrl, '_blank');
                  }}
                >
                  <Share2 className="mr-2 h-4 w-4" /> Open
                </Button>
                <Button 
                  onClick={() => {
                    const qrUrl = selectedLink.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(buildFullTrackingUrl(selectedLink))}`;
                    navigator.clipboard.writeText(qrUrl);
                    toast({
                      title: 'QR Code URL Copied',
                      description: 'QR code URL copied to clipboard.',
                    });
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" /> Copy URL
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}