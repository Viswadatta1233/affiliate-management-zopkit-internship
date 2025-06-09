import React from 'react';
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

interface CampaignFiltersProps {
  filters: {
    targetAudienceAgeGroup: string;
    requiredNiche: string;
    startDate: Date | null;
    endDate: Date | null;
  };
  onFilterChange: (filters: {
    targetAudienceAgeGroup: string;
    requiredNiche: string;
    startDate: Date | null;
    endDate: Date | null;
  }) => void;
  onReset: () => void;
}

export function CampaignFilters({ filters, onFilterChange, onReset }: CampaignFiltersProps) {
  const handleValueChange = (field: keyof typeof filters, value: string | Date | null) => {
    onFilterChange({
      ...filters,
      [field]: value
    });
  };

  const hasActiveFilters = 
    filters.targetAudienceAgeGroup !== "all" ||
    filters.requiredNiche !== "all" ||
    filters.startDate !== null ||
    filters.endDate !== null;

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <label className="text-sm font-medium">Start Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.startDate ? format(filters.startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.startDate || undefined}
                  onSelect={(date) => handleValueChange("startDate", date || null)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">End Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.endDate ? format(filters.endDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.endDate || undefined}
                  onSelect={(date) => handleValueChange("endDate", date || null)}
                  initialFocus
                />
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
  );
}