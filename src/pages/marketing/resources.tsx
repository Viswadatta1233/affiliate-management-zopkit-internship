import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, FileText, Image, Link } from "lucide-react"

export default function MarketingResources() {
  const resources = [
    {
      title: "Brand Assets",
      description: "Logos, banners, and other brand materials",
      icon: Image,
    },
    {
      title: "Marketing Guidelines",
      description: "Best practices and promotional guidelines",
      icon: FileText,
    },
    {
      title: "Promotional Links",
      description: "Pre-made promotional links and banners",
      icon: Link,
    },
    {
      title: "Downloadable Resources",
      description: "PDFs, presentations, and marketing materials",
      icon: Download,
    },
  ]

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Marketing Resources</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {resources.map((resource, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <resource.icon className="h-5 w-5 text-primary" />
                <CardTitle>{resource.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{resource.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}