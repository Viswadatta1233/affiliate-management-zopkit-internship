import React, { useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useAuthStore } from '@/store/auth-store';
import { useInfluencerStore } from '@/store/influencer-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Instagram, Facebook, Users, MapPin, Download, Twitter } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import { toast } from 'sonner';

const ZopkitInfo = () => {
    return (
        <div className="text-center mt-12 text-gray-500">
            <p className="font-semibold">Powered by Zopkit</p>
            <p className="text-xs">Hyderabd, IT-HUB</p>
            <p className="text-xs">contact@zopkit.com</p>
        </div>
    );
};

const MediaKitPage = () => {
    const { user } = useAuthStore();
    const { 
      instagramAnalytics: insta, 
      facebookAnalytics: fb,
      twitterAnalytics: tw,
      isLoading,
      error,
      fetchInstagramAnalytics,
      fetchFacebookAnalytics,
      fetchTwitterAnalytics
    } = useInfluencerStore();

    const pdfRef = useRef<HTMLDivElement>(null);
    const userName = user ? `${user.firstName} ${user.lastName}` : 'Influencer';

    useEffect(() => {
        fetchInstagramAnalytics();
        fetchFacebookAnalytics();
        fetchTwitterAnalytics();
    }, [fetchInstagramAnalytics, fetchFacebookAnalytics, fetchTwitterAnalytics]);

    const handleExportPdf = async () => {
        const input = pdfRef.current;
        if (!input) {
            toast.error('Could not find the content to export.');
            return;
        }

        toast.info('Generating PDF, please wait...');

        try {
            const canvas = await html2canvas(input, {
                scale: 2, // Use a good scale for quality
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4', true); // 'true' for compression

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            let heightLeft = imgHeight;
            let position = 0;

            // Add the first page
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();

            // Add new pages if content is taller than one page
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdf.internal.pageSize.getHeight();
            }
            
            pdf.save(`${userName.replace(/ /g, '_')}_Media_Kit.pdf`);
            toast.success('PDF exported successfully!');

        } catch (err) {
            console.error("Error generating PDF:", err);
            toast.error('Failed to export PDF.');
        }
    };

    const generateAudienceOverview = () => {
        const connectedPlatforms = [];
        if (insta) connectedPlatforms.push({ name: 'Instagram', data: insta });
        if (fb) connectedPlatforms.push({ name: 'Facebook', data: fb });
        if (tw) connectedPlatforms.push({ name: 'Twitter', data: tw });

        if (connectedPlatforms.length === 0) {
            return "Connect your social media accounts to generate an audience overview.";
        }

        const totalFollowers = connectedPlatforms.reduce((sum, p) => sum + (p.data.followerCount || 0), 0).toLocaleString();
        const locations = [...new Set(connectedPlatforms.map(p => p.data.topAudienceLocation))].join(', ');
        
        const avgEngagement = (
            connectedPlatforms.reduce((sum, p) => sum + parseFloat(p.data.averageEngagementRate || '0'), 0) / connectedPlatforms.length
        ).toFixed(2);

        return `Across your connected platforms, you have a combined audience of ${totalFollowers} followers. Your primary audience hubs are in ${locations}. You maintain an impressive average engagement rate of ${avgEngagement}%, indicating a strong connection with your audience.`;
    };

    const renderAnalyticsSection = (analytics: any, title: string, icon: React.ReactNode) => {
        if (!analytics) return null;
    
        const genderData = [
            { name: 'Male', value: parseFloat(analytics.malePercentage) },
            { name: 'Female', value: parseFloat(analytics.femalePercentage) },
        ];
        const GENDER_COLORS = ['#0088FE', '#FF8042'];
        const engagementRate = parseFloat(analytics.averageEngagementRate || '0');
    
        return (
            <Card className="bg-white/50 backdrop-blur-sm border-gray-200/50 shadow-lg w-full break-inside-avoid-page">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 text-gray-700">
                        {icon}
                        <div>
                            <CardTitle className="text-lg font-bold">{title} Analytics</CardTitle>
                            <p className="text-xs text-gray-500">@{analytics.username}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 text-gray-600">
                    <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="p-2 bg-teal-50 rounded-lg">
                            <p className="text-xs font-medium text-teal-700">Followers</p>
                            <p className="text-lg font-bold text-teal-900">{(analytics.followerCount || 0).toLocaleString()}</p>
                        </div>
                        <div className="p-2 bg-pink-50 rounded-lg">
                            <p className="text-xs font-medium text-pink-700">Engagement</p>
                            <p className="text-lg font-bold text-pink-900">{engagementRate.toFixed(2)}%</p>
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <p className="font-semibold flex items-center gap-1 text-sm"><MapPin className="h-3 w-3 text-gray-400"/> Top Location</p>
                        <p className="ml-4 text-sm">{analytics.topAudienceLocation}</p>
                    </div>

                    <div className="space-y-1">
                        <p className="font-semibold flex items-center gap-1 text-sm"><Users className="h-3 w-3 text-gray-400"/> Age Range</p>
                        <p className="ml-4 text-sm">{analytics.audienceDemographicsAgeRange}</p>
                    </div>

                    <div>
                        <p className="font-semibold mb-2 text-center text-sm">Gender Split</p>
                        <ResponsiveContainer width="100%" height={120}>
                            <PieChart>
                                <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={40} fill="#8884d8">
                                    {genderData.map((entry, index) => <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />)}
                                </Pie>
                                <RechartsTooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        );
    };

    if (isLoading && !insta && !fb && !tw) {
        return <div className="p-8 text-center">Loading media kit data...</div>;
    }
    
    if (error && !insta && !fb && !tw) {
      return (
        <div className="p-8 text-center text-red-600">
          <h2 className="text-xl font-semibold">Could not load Media Kit</h2>
          <p>There was an error fetching your data. Please ensure your accounts are connected on the dashboard.</p>
        </div>
      );
    }

    if (!user || (!insta && !fb && !tw)) {
      return (
        <div className="p-8 text-center text-gray-500">
            <h2 className="text-xl font-semibold">Your Media Kit is Empty</h2>
            <p>Please connect at least one social media account on your dashboard to view your analytics.</p>
        </div>
      );
    }

    return (
        <div className="bg-gray-50">
            <div className="p-6 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Your Media Kit</h1>
                <Button onClick={handleExportPdf} disabled={isLoading} className="bg-gray-800 text-white hover:bg-gray-900 rounded-full px-6 shadow-md">
                    <Download className="mr-2 h-4 w-4" />
                    {isLoading ? 'Exporting...' : 'Export as PDF'}
                </Button>
            </div>
            <div className="p-4">
                <div ref={pdfRef} className="p-8 bg-white rounded-lg shadow-xl max-w-4xl mx-auto">
                    <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-teal-500 pb-6 mb-8">
                        <div>
                            <h1 className="text-4xl font-extrabold text-gray-800">{userName}</h1>
                            <p className="text-lg text-gray-500 mt-1">Influencer Media Kit</p>
                        </div>
                    </div>
        
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center mb-8">
                        <div className="md:col-span-1 flex justify-center">
                            <Avatar className="h-32 w-32 border-4 border-teal-200 shadow-xl">
                                <AvatarImage src={insta?.profilePictureUrl || fb?.profilePictureUrl || tw?.profilePictureUrl || ""} alt={userName} />
                                <AvatarFallback className="bg-teal-500 text-white text-4xl">{user?.firstName?.[0]}</AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="md:col-span-2">
                            <Card className="bg-gradient-to-br from-teal-50 to-green-100 border-none shadow-md">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-teal-800 text-lg">Audience Overview</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <p className="text-teal-700 leading-relaxed text-sm">{generateAudienceOverview()}</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
        
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {insta && renderAnalyticsSection(insta, 'Instagram', <Instagram className="h-5 w-5 text-pink-500" />)}
                        {fb && renderAnalyticsSection(fb, 'Facebook', <Facebook className="h-5 w-5 text-blue-600" />)}
                        {tw && renderAnalyticsSection(tw, 'Twitter', <Twitter className="h-5 w-5 text-sky-500" />)}
                    </div>
        
                    <ZopkitInfo />
                </div>
            </div>
        </div>
    );
};

export default MediaKitPage;