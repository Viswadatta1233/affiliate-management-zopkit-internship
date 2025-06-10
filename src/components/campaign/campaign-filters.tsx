import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { NICHE_OPTIONS, AGE_GROUP_OPTIONS } from "@/lib/constants";
import { DateRange } from 'react-day-picker';

interface CampaignFiltersProps {
  filters: {
    targetAudienceAgeGroup: string;
    requiredNiche: string;
    dateRange: DateRange | null;
  };
  onFilterChange: (filters: {
    targetAudienceAgeGroup: string;
    requiredNiche: string;
    dateRange: DateRange | null;
  }) => void;
  onReset: () => void;
}

// Add fade-in animation style
const fadeInStyle = {
  animation: 'fadeInPrompt 0.4s',
};

// Add keyframes for fade-in
const fadeInKeyframes = `
@keyframes fadeInPrompt {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

export function CampaignFilters({ filters, onFilterChange, onReset }: CampaignFiltersProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const handleValueChange = (field: keyof typeof filters, value: any) => {
    onFilterChange({
      ...filters,
      [field]: value
    });
  };

  // Helper text for date range selection
  let dateHelper = 'Select start date';
  if (filters.dateRange?.from && !filters.dateRange?.to) {
    dateHelper = 'Select end date';
  } else if (filters.dateRange?.from && filters.dateRange?.to) {
    dateHelper = '';
  }

  const hasActiveFilters =
    filters.targetAudienceAgeGroup !== "all" ||
    filters.requiredNiche !== "all" ||
    (filters.dateRange && filters.dateRange.from && filters.dateRange.to);

  return (
    <>
      {/* Inject fade-in keyframes */}
      <style>{fadeInKeyframes}</style>
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Age Group</label>
              <Select
                value={filters.targetAudienceAgeGroup}
                onValueChange={(value) => handleValueChange("targetAudienceAgeGroup", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select age group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ages</SelectItem>
                  {AGE_GROUP_OPTIONS.map((ageGroup) => (
                    <SelectItem key={ageGroup.value} value={ageGroup.value}>
                      {ageGroup.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Niche</label>
              <Select
                value={filters.requiredNiche}
                onValueChange={(value) => handleValueChange("requiredNiche", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select niche" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Niches</SelectItem>
                  {NICHE_OPTIONS.map((niche) => (
                    <SelectItem key={niche.value} value={niche.value}>
                      {niche.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Pick Date Range</label>
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateRange?.from && !filters.dateRange?.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange?.from && filters.dateRange?.to
                      ? `${format(filters.dateRange.from, "PPP")} - ${format(filters.dateRange.to, "PPP")}`
                      : filters.dateRange?.from
                      ? `${format(filters.dateRange.from, "PPP")} - ...`
                      : "Pick a date range"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="range"
                    selected={filters.dateRange || undefined}
                    onSelect={(range) => {
                      handleValueChange("dateRange", range);
                      // Auto-close popover if both dates are picked
                      if (range?.from && range?.to) {
                        setPopoverOpen(false);
                      }
                    }}
                    initialFocus
                  />
                  {dateHelper && (
                    <div
                      className="mx-auto mt-3 mb-2 px-4 py-2 rounded-lg border border-yellow-300 bg-yellow-100 text-yellow-900 text-base font-semibold text-center shadow-sm"
                      style={fadeInStyle}
                    >
                      {dateHelper}
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={onReset}>
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}