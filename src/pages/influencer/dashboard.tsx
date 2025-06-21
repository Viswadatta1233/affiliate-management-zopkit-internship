import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useAuthStore } from '@/store/auth-store';
import { useInfluencerStore } from '@/store/influencer-store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Instagram, Twitter, Facebook, MoreVertical, AlertCircle, FileText, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function InfluencerDashboard() {
    const { user } = useAuthStore();
    const { 
      isLoading, 
      error, 
      isConnected,
      isFbConnected,
      isTwitterConnected,
      connectInstagram, 
      fetchInstagramAnalytics,
      connectFacebook,
      fetchFacebookAnalytics,
      connectTwitter,
      fetchTwitterAnalytics,
      clearError 
    } = useInfluencerStore();

    // State for username inputs
    const [instagramUsername, setInstagramUsername] = useState('');
    const [facebookUsername, setFacebookUsername] = useState('');
    const [twitterUsername, setTwitterUsername] = useState('');
    const [showInstagramInput, setShowInstagramInput] = useState(false);
    const [showFacebookInput, setShowFacebookInput] = useState(false);
    const [showTwitterInput, setShowTwitterInput] = useState(false);

    useEffect(() => {
      fetchInstagramAnalytics();
      fetchFacebookAnalytics();
      fetchTwitterAnalytics();
    }, [fetchInstagramAnalytics, fetchFacebookAnalytics, fetchTwitterAnalytics]);

    const handleConnectInstagram = async () => {
      if (!instagramUsername.trim()) {
        toast.error('Please enter your Instagram username');
        return;
      }
      try {
        await connectInstagram(instagramUsername.trim());
        toast.success('Instagram connected successfully!');
        setShowInstagramInput(false);
        setInstagramUsername('');
      } catch (error) {
        toast.error('Failed to connect Instagram');
      }
    };

    const handleConnectFacebook = async () => {
      if (!facebookUsername.trim()) {
        toast.error('Please enter your Facebook username');
        return;
      }
      try {
        await connectFacebook(facebookUsername.trim());
        toast.success('Facebook connected successfully!');
        setShowFacebookInput(false);
        setFacebookUsername('');
      } catch (error) {
        toast.error('Failed to connect Facebook');
      }
    };

    const handleConnectTwitter = async () => {
      if (!twitterUsername.trim()) {
        toast.error('Please enter your Twitter username');
        return;
      }
      try {
        await connectTwitter(twitterUsername.trim());
        toast.success('Twitter connected successfully!');
        setShowTwitterInput(false);
        setTwitterUsername('');
      } catch (error) {
        toast.error('Failed to connect Twitter');
      }
    };

    useEffect(() => {
      if (error) {
        const timer = setTimeout(() => {
          clearError();
        }, 5000);
        return () => clearTimeout(timer);
      }
    }, [error, clearError]);
  
  const stats = {
    potential: 58,
    accountNumber: "3253",
    viewers: "65,031",
    engagement: "25,214",
    monthlyGoal: {
      progress: 53,
      points: 350
    },
    socialMedia: {
      instagram: { points: 1230 },
      twitter: { points: 1230 },
      facebook: { points: 1230 }
    },
    actions: [
      { icon: "📝", title: "3 Posts Added", color: "bg-blue-100" },
      { icon: "⭐", title: "Premium Plan Bought", color: "bg-purple-100" },
      { icon: "📹", title: "2 Videos Added", color: "bg-green-100" },
      { icon: "✅", title: "Sponsorship Signed", color: "bg-teal-100" }
    ]
  };
  
  const isMediaKitReady = isConnected || isFbConnected || isTwitterConnected;

    return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-teal-500 to-teal-400 px-8 py-4 rounded-r-full -ml-6 shadow-lg">
          Your Stats
        </h1>
        <Button variant="outline" className="rounded-full px-6 shadow-sm">
          More Details
        </Button>
      </div>

      {isMediaKitReady && (
        <Card className="shadow-md border-0 bg-gradient-to-r from-teal-50 to-green-50">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-teal-500 to-green-500 p-3 rounded-full">
                            <FileText className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Your Media Kit is Ready!</CardTitle>
                            <CardDescription>
                                View your combined social media analytics in one place.
                            </CardDescription>
                        </div>
                    </div>
                    <Button asChild className="bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 text-white shadow-lg">
                        <Link to="/influencer/media-kit">
                          View Media Kit
                        </Link>
                    </Button>
                </div>
            </CardHeader>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Instagram Connection Section */}
        <Card className="shadow-md border-0 bg-gradient-to-r from-pink-50 to-purple-50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-3 rounded-full">
                  <Instagram className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Instagram Analytics</CardTitle>
                  <CardDescription>
                    {isConnected ? 'Instagram account is connected.' : 'Connect your Instagram to generate your media kit.'}
                  </CardDescription>
                </div>
              </div>
              {isConnected ? (
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium">Connected</span>
                </div>
              ) : (
                <Button 
                  onClick={() => setShowInstagramInput(true)}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                >
                  <Instagram className="h-4 w-4 mr-2" />
                  Connect Instagram
                </Button>
              )}
            </div>
          </CardHeader>
          
          {showInstagramInput && (
            <CardContent className="pt-0">
              <div className="space-y-4 p-4 bg-white rounded-lg border border-pink-200">
                <div className="flex items-center justify-between">
                  <Label htmlFor="instagram-username" className="text-sm font-medium">
                    Enter your Instagram username:
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowInstagramInput(false);
                      setInstagramUsername('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    id="instagram-username"
                    value={instagramUsername}
                    onChange={(e) => setInstagramUsername(e.target.value)}
                    placeholder="@username"
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleConnectInstagram()}
                  />
                  <Button 
                    onClick={handleConnectInstagram} 
                    disabled={isLoading || !instagramUsername.trim()}
                    className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                  >
                    {isLoading ? 'Connecting...' : 'Connect'}
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
          
          {error && !isConnected && !showInstagramInput && (
            <CardContent className="pt-0">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </CardContent>
          )}
        </Card>
      
        {/* Facebook Connection Section */}
        <Card className="shadow-md border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-full">
                  <Facebook className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Facebook Analytics</CardTitle>
                  <CardDescription>
                    {isFbConnected ? 'Facebook account is connected.' : 'Connect your Facebook account to enhance your media kit.'}
                  </CardDescription>
                </div>
              </div>
              {isFbConnected ? (
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium">Connected</span>
                </div>
              ) : (
                <Button 
                  onClick={() => setShowFacebookInput(true)}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                >
                  <Facebook className="h-4 w-4 mr-2" />
                  Connect Facebook
                </Button>
              )}
            </div>
          </CardHeader>
        
          {showFacebookInput && (
            <CardContent className="pt-0">
              <div className="space-y-4 p-4 bg-white rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <Label htmlFor="facebook-username" className="text-sm font-medium">
                    Enter your Facebook username:
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowFacebookInput(false);
                      setFacebookUsername('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    id="facebook-username"
                    value={facebookUsername}
                    onChange={(e) => setFacebookUsername(e.target.value)}
                    placeholder="username"
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleConnectFacebook()}
                  />
                  <Button 
                    onClick={handleConnectFacebook} 
                    disabled={isLoading || !facebookUsername.trim()}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                  >
                    {isLoading ? 'Connecting...' : 'Connect'}
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        
          {error && !isFbConnected && !showFacebookInput && (
            <CardContent className="pt-0">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </CardContent>
          )}
        </Card>

        {/* Twitter Connection Section */}
        <Card className="shadow-md border-0 bg-gradient-to-r from-cyan-50 to-sky-50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-cyan-500 to-sky-500 p-3 rounded-full">
                  <Twitter className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Twitter Analytics</CardTitle>
                  <CardDescription>
                    {isTwitterConnected ? 'Twitter account is connected.' : 'Connect your Twitter to enhance your media kit.'}
                  </CardDescription>
                </div>
              </div>
              {isTwitterConnected ? (
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium">Connected</span>
                </div>
              ) : (
                <Button 
                  onClick={() => setShowTwitterInput(true)}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white"
                >
                  <Twitter className="h-4 w-4 mr-2" />
                  Connect Twitter
                </Button>
              )}
            </div>
          </CardHeader>
        
          {showTwitterInput && (
            <CardContent className="pt-0">
              <div className="space-y-4 p-4 bg-white rounded-lg border border-cyan-200">
                <div className="flex items-center justify-between">
                  <Label htmlFor="twitter-username" className="text-sm font-medium">
                    Enter your Twitter username:
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowTwitterInput(false);
                      setTwitterUsername('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    id="twitter-username"
                    value={twitterUsername}
                    onChange={(e) => setTwitterUsername(e.target.value)}
                    placeholder="@username"
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleConnectTwitter()}
                  />
                  <Button 
                    onClick={handleConnectTwitter} 
                    disabled={isLoading || !twitterUsername.trim()}
                    className="bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white"
                  >
                    {isLoading ? 'Connecting...' : 'Connect'}
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        
          {error && !isTwitterConnected && !showTwitterInput && (
            <CardContent className="pt-0">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </CardContent>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Account Details */}
        <div className="lg:col-span-2">
          <Card className="shadow-md border-0 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Account Details</CardTitle>
          </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Potential Progress */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle 
                      className="text-gray-200" 
                      strokeWidth="10" 
                      stroke="currentColor" 
                      fill="transparent" 
                      r="40" 
                      cx="50" 
                      cy="50" 
                    />
                    <circle 
                      className="text-teal-500" 
                      strokeWidth="10" 
                      strokeDasharray={`${stats.potential * 2.51} 251`} 
                      strokeLinecap="round" 
                      stroke="currentColor" 
                      fill="transparent" 
                      r="40" 
                      cx="50" 
                      cy="50" 
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">{stats.potential}%</span>
                    <span className="text-xs text-gray-500">POTENTIAL</span>
                  </div>
                </div>
              </div>

              {/* Account Card */}
              <div className="flex flex-col">
                <div className="bg-gradient-to-r from-pink-500 to-pink-400 rounded-lg p-4 text-white shadow-lg h-full flex flex-col justify-between">
                  <div className="uppercase text-sm font-bold mb-4">Account</div>
                  <div className="text-lg font-bold">**** {stats.accountNumber}</div>
                  <div className="mt-4 flex justify-end">
                    <div className="bg-white/20 p-2 rounded-full">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M7.5 12H16.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 7.5V16.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                {/* Viewers */}
                <div className="bg-white rounded-lg p-4 shadow-md border border-gray-100">
                  <div className="text-sm text-gray-500 mb-1">Viewers</div>
                  <div className="flex items-center justify-center">
                    <svg className="w-full h-16" viewBox="0 0 100 30">
                      <path d="M0,15 Q10,5 20,15 T40,15 T60,15 T80,15 T100,15" fill="none" stroke="#10B981" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="text-center font-semibold mt-1">{stats.viewers} views</div>
                </div>
                
                {/* Engagement */}
                <div className="bg-white rounded-lg p-4 shadow-md border border-gray-100">
                  <div className="text-sm text-gray-500 mb-1">Engagement</div>
                  <div className="flex items-center justify-center">
                    <svg className="w-full h-16" viewBox="0 0 100 30">
                      <path d="M0,20 Q25,5 50,20 T100,10" fill="none" stroke="#EC4899" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="text-center font-semibold mt-1">{stats.engagement} focused</div>
                </div>
              </div>
          </CardContent>
        </Card>

          {/* Actions Performed */}
          <Card className="mt-6 shadow-md border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Actions Performed</CardTitle>
          </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {stats.actions.map((action, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`${action.color} w-10 h-10 rounded-lg flex items-center justify-center text-lg`}>
                      {action.icon}
                    </div>
                    <span className="text-sm font-medium">{action.title}</span>
                  </div>
                ))}
              </div>
          </CardContent>
        </Card>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Mobile App Sync */}
            <Card className="shadow-md border-0 bg-gradient-to-br from-yellow-50 to-yellow-100">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Mobile App Sync</h3>
                  <div className="flex items-center">
                    <div className="bg-yellow-200 rounded-lg p-2">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="5" y="2" width="14" height="20" rx="2" stroke="#F59E0B" strokeWidth="2"/>
                        <path d="M12 18H12.01" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-yellow-200 rounded-full opacity-50"></div>
                  <div className="relative z-10">
                    <img src="https://placehold.co/120x120/FFEDD5/F59E0B?text=📱" alt="Mobile App" className="w-20 h-20 object-cover" />
                  </div>
                </div>
          </CardContent>
        </Card>

            {/* Influence Ranking */}
            <Card className="shadow-md border-0 bg-gradient-to-br from-teal-50 to-teal-100">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Influence Ranking</h3>
                  <div className="flex items-center">
                    <div className="bg-teal-200 rounded-lg p-2">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 4L8 12L16 20" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-teal-200 rounded-full opacity-50"></div>
                  <div className="relative z-10 bg-white rounded-full w-12 h-12 flex items-center justify-center text-teal-500 font-bold text-xl">
                    #11
                  </div>
            </div>
        </CardContent>
      </Card>
          </div>
        </div>

        {/* Right Column - User Profile */}
        <div>
          <Card className="shadow-md border-0 h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-500">Hello,</div>
                <div className="font-semibold">{user?.firstName || 'David'} {user?.lastName || 'Jones'}</div>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col items-center pt-6">
              <Avatar className="h-24 w-24 border-4 border-white shadow-xl mb-6">
                <AvatarImage src={"https://placehold.co/200x200/FFFFFF/5EEAD4?text=👤"} alt={user?.firstName || "User"} />
                <AvatarFallback className="bg-teal-100 text-teal-800 text-2xl">
                  {user?.firstName?.[0] || "D"}
                </AvatarFallback>
              </Avatar>

              {/* Monthly Goal */}
              <div className="w-full mb-6">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-medium">Monthly Goal</div>
                  <div className="text-gray-500">{stats.monthlyGoal.points} Points</div>
                </div>
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-gray-100 flex items-center justify-center absolute -left-2 -top-1 bg-white">
                    <div className="text-teal-500 font-bold text-lg">{stats.monthlyGoal.progress}%</div>
                  </div>
                  <Progress value={stats.monthlyGoal.progress} className="h-3 ml-6" />
                </div>
              </div>

              {/* Social Media Accounts */}
              <div className="w-full space-y-4 mt-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-pink-100 p-2 rounded-full">
                      <Instagram className="h-5 w-5 text-pink-500" />
                    </div>
                    <span>Instagram</span>
                  </div>
                  <div>{stats.socialMedia.instagram.points} Points</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Twitter className="h-5 w-5 text-blue-500" />
                    </div>
                    <span>Twitter</span>
                  </div>
                  <div>{stats.socialMedia.twitter.points} Points</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-full">
                      <Facebook className="h-5 w-5 text-indigo-500" />
                    </div>
                    <span>Facebook</span>
                  </div>
                  <div>{stats.socialMedia.facebook.points} Points</div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black">
                LOOK FOR SPONSORSHIP
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}