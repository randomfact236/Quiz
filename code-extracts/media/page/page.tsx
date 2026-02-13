"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Upload,
  Search,
  ImageIcon,
  FileImage,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  Trash2,
  Copy,
  ExternalLink,
  Grid,
  List,
  Filter,
  X,
  CheckSquare,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Calendar,
  HardDrive,
} from "lucide-react";
import { toast } from "sonner";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Media {
  id: string;
  filename: string;
  originalUrl: string;
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  conversionStatus: string;
  isConverted: boolean;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface ConversionStats {
  totalImages: number;
  fullyOptimized: number;
  needsConversion: number;
  storageSaved: number;
  storageSavedFormatted: string;
  optimizationPercentage: number;
}

interface MediaResponse {
  items: Media[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type ViewMode = "grid" | "list";
type SortBy = "createdAt" | "filename" | "fileSize";
type SortOrder = "asc" | "desc";
type FilterStatus = "all" | "converted" | "pending";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

export default function MediaPage() {
  const router = useRouter();
  const [media, setMedia] = useState<Media[]>([]);
  const [stats, setStats] = useState<ConversionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Sort
  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Preview Dialog
  const [previewMedia, setPreviewMedia] = useState<Media | null>(null);

  // Confirm Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  // Drag & Drop
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy,
        sortOrder,
      });

      if (searchQuery) params.append("search", searchQuery);
      if (filterStatus !== "all") params.append("status", filterStatus);

      const response = await fetch(`${API_URL}/media?${params}`);
      if (response.ok) {
        const data: MediaResponse = await response.json();
        setMedia(data.items);
        setTotalItems(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch media:", error);
      toast.error("Failed to load media");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchQuery, filterStatus, sortBy, sortOrder]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/media/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchMedia();
    fetchStats();
  }, [fetchMedia]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
    setSelectAll(false);
  }, [searchQuery, filterStatus, sortBy, sortOrder]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "FAILED":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "PROCESSING":
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <FileImage className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (item: Media) => {
    if (item.isConverted) {
      return <Badge className="bg-green-100 text-green-700">Optimized</Badge>;
    }
    return <Badge variant="outline" className="text-yellow-600 border-yellow-300">Pending</Badge>;
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(media.map((m) => m.id)));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Copy URL
  const copyUrl = (url: string, type: string = "URL") => {
    navigator.clipboard.writeText(url);
    toast.success(`${type} copied to clipboard`);
  };

  // Delete single
  const handleDelete = (item: Media) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Media",
      description: `Are you sure you want to delete "${item.filename}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_URL}/media/${item.id}`, {
            method: "DELETE",
          });
          if (response.ok) {
            toast.success("Media deleted successfully");
            await fetchMedia();
            await fetchStats();
          } else {
            toast.error("Failed to delete media");
          }
        } catch (error) {
          toast.error("Failed to delete media");
        }
      },
    });
  };

  // Bulk delete
  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;

    setConfirmDialog({
      isOpen: true,
      title: "Delete Media",
      description: `Are you sure you want to delete ${selectedIds.size} item${selectedIds.size === 1 ? "" : "s"}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_URL}/media/bulk-delete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: Array.from(selectedIds) }),
          });
          if (response.ok) {
            toast.success(`${selectedIds.size} items deleted`);
            setSelectedIds(new Set());
            setSelectAll(false);
            await fetchMedia();
            await fetchStats();
          }
        } catch (error) {
          toast.error("Failed to delete media");
        }
      },
    });
  };

  // File upload handlers
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    const totalFiles = files.length;
    let uploaded = 0;

    for (const file of Array.from(files)) {
      try {
        // Convert file to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const base64 = await base64Promise;

        // Create media entry
        const newMedia: Partial<Media> = {
          filename: file.name,
          originalUrl: base64,
          mimeType: file.type,
          fileSize: file.size,
          thumbnailUrl: base64,
          conversionStatus: "PENDING",
          isConverted: false,
          width: null,
          height: null,
        };

        const response = await fetch(`${API_URL}/media`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newMedia),
        });

        if (response.ok) {
          uploaded++;
          setUploadProgress(Math.round((uploaded / totalFiles) * 100));
        }
      } catch (error) {
        console.error("Failed to upload file:", error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setIsUploading(false);
    setUploadProgress(0);
    
    if (uploaded > 0) {
      toast.success(`${uploaded} file${uploaded === 1 ? "" : "s"} uploaded successfully`);
      await fetchMedia();
      await fetchStats();
    }
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Download media
  const handleDownload = (item: Media) => {
    const link = document.createElement("a");
    link.href = item.originalUrl;
    link.download = item.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download started");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-8 py-8 text-white">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <ImageIcon className="h-8 w-8" />
                Media Library
              </h1>
              <p className="mt-2 text-indigo-100">
                Manage images, upload files, and optimize storage
              </p>
            </div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
              <Button
                className="bg-white text-indigo-600 hover:bg-indigo-50"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {isUploading ? `Uploading ${uploadProgress}%` : "Upload"}
              </Button>
            </div>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-white/5" />
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Images</span>
              </div>
              <p className="mt-2 text-3xl font-bold">{stats.totalImages}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Optimized</span>
              </div>
              <p className="mt-2 text-3xl font-bold">{stats.fullyOptimized}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Pending</span>
              </div>
              <p className="mt-2 text-3xl font-bold">{stats.needsConversion}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Storage Saved</span>
              </div>
              <p className="mt-2 text-3xl font-bold">{stats.storageSavedFormatted}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Optimization Progress */}
      {stats && stats.totalImages > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Optimization Progress</span>
              <span className="text-sm text-muted-foreground">
                {stats.optimizationPercentage}%
              </span>
            </div>
            <Progress value={stats.optimizationPercentage} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Upload Drop Zone */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-8 text-center">
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Drag & drop files here</p>
          <p className="text-sm text-muted-foreground mt-1">
            or click the Upload button to select files
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Supports: JPG, PNG, GIF, WebP, SVG (Max 10MB per file)
          </p>
        </CardContent>
      </Card>

      {/* Search, Filters & View Mode */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search media by filename..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? "bg-indigo-50 text-indigo-600" : ""}
              >
                <Filter className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              >
                {viewMode === "grid" ? (
                  <List className="h-4 w-4" />
                ) : (
                  <Grid className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Status</Label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: "all", label: "All" },
                    { value: "converted", label: "Optimized" },
                    { value: "pending", label: "Pending" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      variant={filterStatus === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterStatus(option.value as FilterStatus)}
                      className={
                        filterStatus === option.value
                          ? "bg-indigo-600 hover:bg-indigo-700"
                          : ""
                      }
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Sort By</Label>
                <div className="flex gap-2">
                  <select
                    className="h-9 px-3 rounded-md border border-input bg-background text-sm"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                  >
                    <option value="createdAt">Date</option>
                    <option value="filename">Name</option>
                    <option value="fileSize">Size</option>
                  </select>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-indigo-600" />
            <span className="font-medium text-indigo-900">
              {selectedIds.size} selected
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDelete}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Media Display */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : media.length === 0 ? (
        <Card className="p-12 text-center">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No media found</p>
          {searchQuery && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setSearchQuery("")}
            >
              Clear Search
            </Button>
          )}
        </Card>
      ) : viewMode === "grid" ? (
        // Grid View
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {media.map((item) => (
            <Card
              key={item.id}
              className={`overflow-hidden group cursor-pointer transition-all ${
                selectedIds.has(item.id)
                  ? "ring-2 ring-indigo-500 ring-offset-2"
                  : "hover:shadow-lg"
              }`}
              onClick={() => setPreviewMedia(item)}
            >
              {/* Image Preview */}
              <div className="aspect-square bg-muted relative">
                {item.thumbnailUrl || item.originalUrl ? (
                  <img
                    src={item.thumbnailUrl || item.originalUrl}
                    alt={item.filename}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                
                {/* Selection Checkbox */}
                <div
                  className="absolute top-2 left-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(item.id);
                  }}
                >
                  <Checkbox checked={selectedIds.has(item.id)} />
                </div>

                {/* Status Icon */}
                <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1">
                  {getStatusIcon(item.conversionStatus)}
                </div>

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewMedia(item);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyUrl(item.originalUrl);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <Button variant="secondary" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => copyUrl(item.originalUrl)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy URL
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(item)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(item)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="truncate text-sm font-medium">{item.filename}</p>
                <div className="mt-2 flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {formatFileSize(item.fileSize)}
                  </Badge>
                  {getStatusBadge(item)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // List View
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <Checkbox checked={selectAll} onCheckedChange={toggleSelectAll} />
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Preview</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Size</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Dimensions</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Date</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {media.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b hover:bg-gray-50 cursor-pointer ${
                      selectedIds.has(item.id) ? "bg-indigo-50/50" : ""
                    }`}
                    onClick={() => setPreviewMedia(item)}
                  >
                    <td className="px-4 py-3" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(item.id)}
                        onCheckedChange={() => toggleSelect(item.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 bg-muted rounded overflow-hidden">
                        {item.thumbnailUrl || item.originalUrl ? (
                          <img
                            src={item.thumbnailUrl || item.originalUrl}
                            alt={item.filename}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-full h-full p-2 text-muted-foreground" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-sm">{item.filename}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {formatFileSize(item.fileSize)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {item.width && item.height
                        ? `${item.width} × ${item.height}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(item)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setPreviewMedia(item)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyUrl(item.originalUrl)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy URL
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(item)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(item)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <DataTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={itemsPerPage}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setItemsPerPage(size);
            setCurrentPage(1);
          }}
        />
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewMedia} onOpenChange={() => setPreviewMedia(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              {previewMedia?.filename}
            </DialogTitle>
          </DialogHeader>
          {previewMedia && (
            <div className="space-y-4">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={previewMedia.originalUrl}
                  alt={previewMedia.filename}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Size:</span>{" "}
                  {formatFileSize(previewMedia.fileSize)}
                </div>
                <div>
                  <span className="text-muted-foreground">Dimensions:</span>{" "}
                  {previewMedia.width && previewMedia.height
                    ? `${previewMedia.width} × ${previewMedia.height}px`
                    : "Unknown"}
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>{" "}
                  {previewMedia.mimeType}
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  {previewMedia.isConverted ? "Optimized" : "Pending"}
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Uploaded:</span>{" "}
                  {formatDate(previewMedia.createdAt)}
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">URL:</span>
                  <div className="flex gap-2 mt-1">
                    <code className="flex-1 bg-muted px-2 py-1 rounded text-xs truncate">
                      {previewMedia.originalUrl}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyUrl(previewMedia.originalUrl)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => handleDownload(previewMedia)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setPreviewMedia(null);
                    handleDelete(previewMedia);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

