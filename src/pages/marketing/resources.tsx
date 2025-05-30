import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Image, FileText, Upload, CheckCircle2, Loader2, Pencil, X } from "lucide-react";
import { toast } from "sonner";

interface Asset {
  id: string;
  type: "logo" | "banner" | "other";
  url: string;
  uploadedAt: string;
}

export default function MarketingResources() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [guidelines, setGuidelines] = useState("");
  const [guidelinesLoading, setGuidelinesLoading] = useState(false);
  const [guidelinesSaving, setGuidelinesSaving] = useState(false);
  const [guidelinesSaved, setGuidelinesSaved] = useState(false);
  const [editingGuidelines, setEditingGuidelines] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [assetType, setAssetType] = useState<"logo" | "banner" | "other">("logo");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [originalGuidelines, setOriginalGuidelines] = useState("");

  // Helper to get tenantId from Zustand's persisted auth-storage
  function getTenantId() {
    const persisted = localStorage.getItem('auth-storage');
    if (!persisted) return '';
    try {
      const parsed = JSON.parse(persisted);
      return parsed?.state?.tenant?.id || '';
    } catch {
      return '';
    }
  }

  // Helper to get token from localStorage
  function getToken() {
    return localStorage.getItem('token') || '';
  }

  // Fetch assets
  useEffect(() => {
    const tenantId = getTenantId();
    const token = getToken();
    if (!tenantId || !token) return;
    fetch("/api/marketing/assets", {
      headers: {
        "x-tenant-id": tenantId,
        "Authorization": `Bearer ${token}`,
      }
    })
      .then(async (res) => {
        if (!res.ok) {
          const error = await res.text();
          console.error("Failed to fetch assets:", error);
          setAssets([]);
          return;
        }
        const data = await res.json();
        setAssets(data);
      });
  }, []);

  // Fetch guidelines
  useEffect(() => {
    const tenantId = getTenantId();
    const token = getToken();
    if (!tenantId || !token) return;
    setGuidelinesLoading(true);
    fetch("/api/marketing/guidelines", {
      headers: {
        "x-tenant-id": tenantId,
        "Authorization": `Bearer ${token}`,
      }
    })
      .then(async (res) => {
        if (!res.ok) {
          const error = await res.text();
          console.error("Failed to fetch guidelines:", error);
          setGuidelines("");
          setOriginalGuidelines("");
          setLastUpdated(null);
          return;
        }
        const data = await res.json();
        setGuidelines(data?.content || "");
        setOriginalGuidelines(data?.content || "");
        if (data?.updatedAt) setLastUpdated(new Date(data.updatedAt).toLocaleString());
      })
      .finally(() => setGuidelinesLoading(false));
  }, []);

  // Handle asset upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0]) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("type", assetType);
      formData.append("file", fileInputRef.current.files[0]);
      const tenantId = getTenantId();
      const token = getToken();
      const res = await fetch("/api/marketing/assets", {
        method: "POST",
        headers: {
          "x-tenant-id": tenantId,
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });
      if (res.ok) {
        const asset = await res.json();
        setAssets((prev) => [asset, ...prev]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        toast.success("Asset uploaded successfully!");
      } else {
        const error = await res.text();
        toast.error("Upload failed: " + error);
      }
    } catch (err) {
      toast.error("An unexpected error occurred during upload.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // Handle guidelines save
  const handleSaveGuidelines = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuidelinesSaving(true);
    setGuidelinesSaved(false);
    const tenantId = getTenantId();
    const token = getToken();
    try {
      const res = await fetch("/api/marketing/guidelines", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ content: guidelines }),
      });
      if (res.ok) {
        toast.success("Guidelines saved successfully!");
        setGuidelinesSaved(true);
        setOriginalGuidelines(guidelines);
        setEditingGuidelines(false);
        setLastUpdated(new Date().toLocaleString());
        setTimeout(() => setGuidelinesSaved(false), 2000);
      } else {
        const error = await res.text();
        toast.error("Failed to save guidelines: " + error);
      }
    } catch (err) {
      toast.error("An unexpected error occurred while saving guidelines.");
      console.error(err);
    } finally {
      setGuidelinesSaving(false);
    }
  };

  // Cancel editing guidelines
  const handleCancelEdit = () => {
    setGuidelines(originalGuidelines);
    setEditingGuidelines(false);
  };

  // Group assets by type (not used in new layout, but kept for future grouping)
  // const groupedAssets = assets.reduce((acc, asset) => {
  //   if (!acc[asset.type]) {
  //     acc[asset.type] = [];
  //   }
  //   acc[asset.type].push(asset);
  //   return acc;
  // }, {} as Record<string, Asset[]>);

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold mb-8 tracking-tight">Marketing Resources</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch w-full">
        {/* Brand Assets Upload & Gallery */}
        <Card className="bg-white/90 shadow-md border border-gray-200 flex flex-col h-full">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <Image className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">Brand Assets</CardTitle>
            </div>
            <CardDescription>Upload logos, banners, and other brand materials for your tenant.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <form className="flex flex-col md:flex-row gap-4 items-stretch md:items-end mb-6" onSubmit={handleUpload}>
              <div className="flex flex-col gap-1 w-full md:w-1/4">
                <Label htmlFor="assetType">Type</Label>
                <select
                  id="assetType"
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value as any)}
                  className="border rounded px-2 py-1 bg-white"
                >
                  <option value="logo">Logo</option>
                  <option value="banner">Banner</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 w-full md:w-2/4">
                <Label htmlFor="assetFile">File</Label>
                <Input 
                  id="assetFile"
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  required 
                  className="w-full" 
                />
              </div>
              <div className="flex flex-col gap-1 w-full md:w-1/4">
                <Label className="invisible">Upload</Label>
                <Button type="submit" disabled={uploading} className="w-full h-10">
                  {uploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </form>
            <hr className="mb-6 border-gray-200" />
            <div className="flex-1">
              {assets.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No assets uploaded yet.</div>
              ) : (
                <div className="w-full grid grid-cols-1 gap-8">
                  {assets.map((asset) => (
                    <div key={asset.id} className="relative group bg-gray-50 border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col items-center justify-center w-full h-72 min-w-0">
                      <img 
                        src={asset.url} 
                        alt={asset.type} 
                        className="w-full h-full object-contain transition-transform group-hover:scale-105" 
                      />
                      <Badge className="absolute top-2 left-2 bg-primary/90 text-white text-xs px-2 py-0.5 rounded capitalize shadow">{asset.type}</Badge>
                      <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white/80 rounded px-2 py-0.5 shadow">
                        {new Date(asset.uploadedAt).toLocaleDateString()}
                      </div>
                      <a 
                        href={asset.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/30 flex items-center justify-center text-white font-semibold text-sm transition-opacity"
                      >
                        View Full Size
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Marketing Guidelines */}
        <Card className="bg-white/90 shadow-md border border-gray-200 flex flex-col h-full">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">Marketing Guidelines</CardTitle>
            </div>
            <CardDescription>Best practices and promotional guidelines for your brand.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {/* View mode */}
            {!editingGuidelines && !guidelinesLoading && (
              <div className="flex flex-col gap-4 flex-1">
                <div className="bg-gray-50 border border-gray-200 rounded p-4 min-h-[120px] max-h-64 overflow-y-auto text-base text-gray-700 whitespace-pre-line">
                  {guidelines || <span className="text-muted-foreground">No guidelines set yet.</span>}
                </div>
                <div className="flex items-center justify-between mt-2">
                  {lastUpdated && (
                    <div className="text-xs text-gray-500">Last updated: {lastUpdated}</div>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setEditingGuidelines(true)}>
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                </div>
                {guidelinesSaved && (
                  <span className="flex items-center text-green-600 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Saved!
                  </span>
                )}
              </div>
            )}
            {/* Edit mode */}
            {editingGuidelines && (
              <form className="flex flex-col gap-4 flex-1" onSubmit={handleSaveGuidelines}>
                <Textarea
                  value={guidelines}
                  onChange={(e) => setGuidelines(e.target.value)}
                  rows={8}
                  placeholder="Enter your marketing guidelines here..."
                  disabled={guidelinesLoading}
                  className="min-h-[120px] bg-gray-50 border border-gray-200"
                />
                <div className="flex items-center justify-between mt-2">
                  {lastUpdated && (
                    <div className="text-xs text-gray-500">Last updated: {lastUpdated}</div>
                  )}
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleCancelEdit} disabled={guidelinesSaving}>
                      <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={guidelinesSaving || guidelinesLoading}
                      size="sm"
                    >
                      {guidelinesSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            )}
            {/* Loading state */}
            {guidelinesLoading && (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}