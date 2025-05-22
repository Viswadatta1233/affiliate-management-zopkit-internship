import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Instagram, Twitter, Youtube, Globe, UserPlus } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

// Sample influencer data
const sampleInfluencers = [
  {
    id: '1',
    name: 'Sarah Johnson',
    handle: '@sarahjstyle',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
    platforms: {
      instagram: { followers: 125000, handle: '@sarahjstyle' },
      youtube: { followers: 50000, handle: 'SarahJStyle' }
    },
    categories: ['fashion', 'lifestyle'],
    engagementRate: 4.8,
    website: 'https://sarahjstyle.com',
    bio: 'Fashion & Lifestyle Content Creator | Sharing daily style inspiration',
    location: 'New York, USA'
  },
  {
    id: '2',
    name: 'Mike Chen',
    handle: '@techreviewmike',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150',
    platforms: {
      youtube: { followers: 250000, handle: 'TechReviewMike' },
      twitter: { followers: 75000, handle: '@techreviewmike' }
    },
    categories: ['tech', 'gadgets'],
    engagementRate: 5.2,
    website: 'https://techreviewmike.com',
    bio: 'Tech Reviewer & Digital Creator | Honest reviews of the latest gadgets',
    location: 'San Francisco, USA'
  },
  {
    id: '3',
    name: 'Emma Davis',
    handle: '@emmafitness',
    avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=150',
    platforms: {
      instagram: { followers: 180000, handle: '@emmafitness' },
      youtube: { followers: 120000, handle: 'EmmaFitness' }
    },
    categories: ['fitness', 'health', 'wellness'],
    engagementRate: 6.1,
    website: 'https://emmafitness.com',
    bio: 'Certified Personal Trainer | Helping you achieve your fitness goals',
    location: 'Los Angeles, USA'
  }
];

export default function InfluencerSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const { toast } = useToast();

  const handleInvite = (influencer: typeof sampleInfluencers[0]) => {
    toast({
      title: "Invitation Sent",
      description: `Invitation sent to ${influencer.name}`,
    });
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count;
  };

  const filteredInfluencers = sampleInfluencers.filter(influencer => {
    const matchesSearch = influencer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      influencer.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      influencer.bio.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategories = selectedCategories.length === 0 ||
      influencer.categories.some(category => selectedCategories.includes(category));

    return matchesSearch && matchesCategories;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Find Influencers</h1>
          <p className="text-muted-foreground">Search and invite influencers to your campaigns</p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search influencers by name, handle, or bio..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6">
        {filteredInfluencers.map((influencer) => (
          <Card key={influencer.id}>
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={influencer.avatar} />
                  <AvatarFallback>{influencer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{influencer.name}</h3>
                      <p className="text-muted-foreground">{influencer.handle}</p>
                    </div>
                    <Button onClick={() => handleInvite(influencer)}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite
                    </Button>
                  </div>

                  <p className="text-sm">{influencer.bio}</p>

                  <div className="flex flex-wrap gap-2">
                    {influencer.categories.map((category) => (
                      <Badge key={category} variant="secondary">
                        {category}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-6">
                    {influencer.platforms.instagram && (
                      <div className="flex items-center gap-2">
                        <Instagram className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {formatFollowers(influencer.platforms.instagram.followers)}
                        </span>
                      </div>
                    )}
                    {influencer.platforms.youtube && (
                      <div className="flex items-center gap-2">
                        <Youtube className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {formatFollowers(influencer.platforms.youtube.followers)}
                        </span>
                      </div>
                    )}
                    {influencer.platforms.twitter && (
                      <div className="flex items-center gap-2">
                        <Twitter className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {formatFollowers(influencer.platforms.twitter.followers)}
                        </span>
                      </div>
                    )}
                    {influencer.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <a 
                          href={influencer.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          Website
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{influencer.location}</span>
                    <span>•</span>
                    <span>{influencer.engagementRate}% Engagement</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}