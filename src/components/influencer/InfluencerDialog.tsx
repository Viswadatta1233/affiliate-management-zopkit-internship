import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InfluencerForm } from './InfluencerForm';

interface InfluencerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
}

export function InfluencerDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}: InfluencerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Influencer' : 'Add New Influencer'}
          </DialogTitle>
        </DialogHeader>
        <InfluencerForm
          initialData={initialData}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
} 