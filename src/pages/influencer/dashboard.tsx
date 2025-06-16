import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, DollarSign, Link2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

// Blue-grey shade for subtle blueish tint (for graphs only)
const BLUE_GREY = '#b6c6e3'; // soft blue-grey
const BLUE_GREY_DARK = '#7d8fa9'; // for lines
const BLUE_GREY_LIGHT = '#eaf0fa'; // for backgrounds/hover

// Static data for charts and table
const topLinks = [
  { name: 'Summer Sale', clicks: 243 },
  { name: 'Black Friday', clicks: 156 },
  { name: 'Spring Collection', clicks: 87 },
];
const earningsByCampaign = [
  { name: 'Summer Sale', earnings: 320 },
  { name: 'Black Friday', earnings: 210 },
  { name: 'Spring Collection', earnings: 90 },
];
const conversionRateOverTime = [
  { date: '2024-05-01', rate: 2.1 },
  { date: '2024-05-02', rate: 2.5 },
  { date: '2024-05-03', rate: 3.0 },
  { date: '2024-05-04', rate: 2.7 },
  { date: '2024-05-05', rate: 3.2 },
];
const trackingLinks = [
  {
    campaignName: 'Summer Sale',
    url: 'https://example.com/summer',
    clicks: 243,
    conversions: 18,
    commission: 320,
    conversionRate: 7.4,
  },
  {
    campaignName: 'Black Friday',
    url: 'https://example.com/blackfriday',
    clicks: 156,
    conversions: 12,
    commission: 210,
    conversionRate: 7.7,
  },
  {
    campaignName: 'Spring Collection',
    url: 'https://example.com/spring',
    clicks: 87,
    conversions: 9,
    commission: 90,
    conversionRate: 10.3,
  },
];

function truncateUrl(url: string, max = 28) {
  if (url.length <= max) return url;
  return url.slice(0, max) + '...';
}

export default function InfluencerDashboard() {
    const { user } = useAuthStore();
    return (
    <div className="container mx-auto py-8 min-h-[90vh] flex flex-col gap-10">
      <h1 className="text-4xl mb-2 tracking-tight text-black">Dashboard</h1>
      <div className="text-xl text-gray-400 mb-6 -mt-2">
        Welcome to your dashboard,{' '}
        <span className="font-semibold text-gray-700">{user?.firstName} {user?.lastName}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-4">
        {/* Top Performing Links Chart */}
        <Card className="shadow-xl border-0 bg-white h-[400px] flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <Link2 className="" style={{ color: BLUE_GREY_DARK }} />
            <CardTitle className="text-2xl text-black">Top Performing Links</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-center">
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={topLinks} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 14, fill: '#000' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 14, fill: '#000' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', color: '#111', borderRadius: 8, border: '1px solid #e5e7eb' }} labelStyle={{ color: '#111' }} />
                <Bar dataKey="clicks" fill="#000" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Earnings by Campaign Chart */}
        <Card className="shadow-xl border-0 bg-white h-[400px] flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <DollarSign className="" style={{ color: BLUE_GREY_DARK }} />
            <CardTitle className="text-2xl text-black">Earnings by Campaign</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-center">
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={earningsByCampaign} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 14, fill: '#000' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 14, fill: '#000' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', color: '#111', borderRadius: 8, border: '1px solid #e5e7eb' }} labelStyle={{ color: '#111' }} />
                <Bar dataKey="earnings" fill="#000" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Conversion Rate Over Time Chart */}
        <Card className="shadow-xl border-0 bg-white h-[400px] flex flex-col justify-between md:col-span-2">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <TrendingUp className="" style={{ color: BLUE_GREY_DARK }} />
            <CardTitle className="text-2xl text-black">Conversion Rate Over Time</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-center">
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={conversionRateOverTime} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 14, fill: '#000' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 14, fill: '#000' }} domain={[0, 'dataMax + 1']} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', color: '#111', borderRadius: 8, border: '1px solid #e5e7eb' }} labelStyle={{ color: '#111' }} />
                <Legend />
                <Line type="monotone" dataKey="rate" stroke="#000" strokeWidth={4} dot={{ r: 7, fill: '#000' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Table View */}
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white via-gray-100 to-gray-50 min-h-[340px] md:col-span-2">
        <CardHeader>
            <CardTitle className="text-2xl text-black">Tracking Links Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-lg text-black">Campaign Name</TableHead>
                    <TableHead className="text-lg text-black">Link URL</TableHead>
                    <TableHead className="text-lg text-black">Clicks</TableHead>
                    <TableHead className="text-lg text-black">Sales (Conversions)</TableHead>
                    <TableHead className="text-lg text-black">Commission Earned</TableHead>
                    <TableHead className="text-lg text-black">Conversion Rate (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trackingLinks.map(link => (
                    <TableRow key={link.campaignName} className="hover:bg-[#eaf0fa] transition cursor-pointer">
                      <TableCell className="text-black">{link.campaignName}</TableCell>
                      <TableCell>
                        <a
                          href={link.url}
                          className="inline-block px-3 py-1 rounded-full bg-[#eaf0fa] text-black font-mono text-sm hover:bg-[#dbeafe] transition max-w-[200px] truncate"
                          target="_blank"
                          rel="noopener noreferrer"
                          title={link.url}
                        >
                          {truncateUrl(link.url)}
                        </a>
                      </TableCell>
                      <TableCell className="text-black">{link.clicks}</TableCell>
                      <TableCell className="text-black">{link.conversions}</TableCell>
                      <TableCell className="text-black">${link.commission}</TableCell>
                      <TableCell className="text-black">{link.conversionRate}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}