"use client";

import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, Loader2, Edit2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function VendorsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<{
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    website?: string | null;
    serviceTypes: string[];
  } | null>(null);

  const { data: vendors, isLoading, refetch } = trpc.vendors.list.useQuery({
    limit: 100,
    search: searchQuery || undefined,
  });

  const createVendor = trpc.vendors.create.useMutation({
    onSuccess: () => {
      setIsCreateDialogOpen(false);
      refetch();
    },
  });

  const updateVendor = trpc.vendors.update.useMutation({
    onSuccess: () => {
      setEditingVendor(null);
      refetch();
    },
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    website: "",
    serviceTypes: [] as string[],
  });

  const serviceTypeOptions = [
    "temporary_housing",
    "permanent_housing",
    "hhg",
    "car_shipment",
    "flight",
    "dsp_orientation",
    "other",
  ];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createVendor.mutate({
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      website: formData.website || undefined,
      serviceTypes: formData.serviceTypes,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendor) return;
    updateVendor.mutate({
      id: editingVendor.id,
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      website: formData.website || undefined,
      serviceTypes: formData.serviceTypes,
    });
  };

  const openEditDialog = (vendor: NonNullable<typeof vendors>[0]) => {
    setEditingVendor({
      id: vendor.id,
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone,
      website: vendor.website,
      serviceTypes: vendor.serviceTypes || [],
    });
    setFormData({
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone || "",
      website: vendor.website || "",
      serviceTypes: vendor.serviceTypes || [],
    });
  };

  const toggleServiceType = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      serviceTypes: prev.serviceTypes.includes(type)
        ? prev.serviceTypes.filter((t) => t !== type)
        : [...prev.serviceTypes, type],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground">
            Manage vendor partners and service providers
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setFormData({ name: "", email: "", phone: "", website: "", serviceTypes: [] });
            }}>
              <Plus className="mr-2 h-4 w-4" />
              New Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Vendor</DialogTitle>
              <DialogDescription>
                Add a new vendor partner to the system
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., ABC Moving Company"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@vendor.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1-555-0100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://vendor.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Service Types</Label>
                  <div className="flex flex-wrap gap-2">
                    {serviceTypeOptions.map((type) => (
                      <Badge
                        key={type}
                        variant={formData.serviceTypes.includes(type) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleServiceType(type)}
                      >
                        {type.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createVendor.isLoading}>
                  {createVendor.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Vendor
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search vendors..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Service Types</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : vendors && vendors.length > 0 ? (
                vendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">{vendor.name}</TableCell>
                    <TableCell>{vendor.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {vendor.phone || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {vendor.website ? (
                        <a
                          href={vendor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {vendor.website}
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(vendor.serviceTypes || []).length > 0 ? (
                          (vendor.serviceTypes || []).slice(0, 2).map((type) => (
                            <Badge key={type} variant="outline" className="text-xs">
                              {type.replace(/_/g, " ")}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                        {(vendor.serviceTypes || []).length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{(vendor.serviceTypes || []).length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(vendor.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(vendor)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No vendors found. Create your first vendor to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingVendor} onOpenChange={(open) => !open && setEditingVendor(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Vendor</DialogTitle>
            <DialogDescription>
              Update vendor information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-website">Website</Label>
                <Input
                  id="edit-website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Service Types</Label>
                <div className="flex flex-wrap gap-2">
                  {serviceTypeOptions.map((type) => (
                    <Badge
                      key={type}
                      variant={formData.serviceTypes.includes(type) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleServiceType(type)}
                    >
                      {type.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingVendor(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateVendor.isLoading}>
                {updateVendor.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

