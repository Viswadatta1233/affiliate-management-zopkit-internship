import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Book, BookOpen, HelpCircle } from "lucide-react";

export default function KnowledgeBase() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground">Resources and guides for affiliates</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search knowledge base..."
          className="pl-10 w-full max-w-xl"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Getting Started
            </CardTitle>
            <CardDescription>Essential guides for new affiliates</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="text-sm">• Affiliate Program Overview</li>
              <li className="text-sm">• Creating Your First Campaign</li>
              <li className="text-sm">• Understanding Commission Structures</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Best Practices
            </CardTitle>
            <CardDescription>Tips for successful promotion</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="text-sm">• Effective Marketing Strategies</li>
              <li className="text-sm">• Optimizing Conversion Rates</li>
              <li className="text-sm">• Building Your Audience</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              FAQ
            </CardTitle>
            <CardDescription>Common questions and answers</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="text-sm">• Payment Processing</li>
              <li className="text-sm">• Technical Support</li>
              <li className="text-sm">• Program Policies</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Articles</CardTitle>
          <CardDescription>Latest resources and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full rounded-md">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <h3 className="font-medium">Maximizing Your Affiliate Revenue</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Learn advanced techniques for increasing your commission earnings
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span>5 min read</span>
                    <span>•</span>
                    <span>Updated 2 days ago</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}