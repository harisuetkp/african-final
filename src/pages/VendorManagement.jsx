import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Plus, Edit, Trash, Store, Phone, Mail, Globe, MapPin, Tag, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import AfricanPattern from '@/components/shared/AfricanPattern';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';

export default function VendorManagement() {
  const [myProfile, setMyProfile] = useState(null);
  const [editVendor, setEditVendor] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (profiles.length > 0) {
          setMyProfile(profiles[0]);
        }
      } catch (e) {
        console.error("Error fetching profile:", e);
      }
    };
    fetchProfile();
  }, []);

  const { data: vendors = [], isLoading: loadingVendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.WeddingVendor.list('-created_date'),
    staleTime: 300000,
    retry: 1
  });

  const createVendorMutation = useMutation({
    mutationFn: async (newVendor) => {
      await base44.entities.WeddingVendor.create(newVendor);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vendors']);
      toast.success("Vendor created successfully!");
      setShowDialog(false);
      setEditVendor(null);
    },
    onError: (error) => {
      toast.error(`Failed to create vendor: ${error.message}`);
    }
  });

  const updateVendorMutation = useMutation({
    mutationFn: async ({ id, updatedVendor }) => {
      await base44.entities.WeddingVendor.update(id, updatedVendor);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vendors']);
      toast.success("Vendor updated successfully!");
      setShowDialog(false);
      setEditVendor(null);
    },
    onError: (error) => {
      toast.error(`Failed to update vendor: ${error.message}`);
    }
  });

  const deleteVendorMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.WeddingVendor.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vendors']);
      toast.success("Vendor deleted successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to delete vendor: ${error.message}`);
    }
  });

  const handleSaveVendor = (vendorData) => {
    if (editVendor) {
      updateVendorMutation.mutate({ id: editVendor.id, updatedVendor: vendorData });
    } else {
      createVendorMutation.mutate(vendorData);
    }
  };

  if (loadingVendors) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-amber-50/20 relative pb-24">
      <AfricanPattern className="text-purple-600" opacity={0.03} />

      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft size={24} />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">Vendor Management</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Manage Vendors</h2>
          <Button onClick={() => { setEditVendor(null); setShowDialog(true); }} className="bg-purple-600 hover:bg-purple-700">
            <Plus size={18} className="mr-2" />
            Add New Vendor
          </Button>
        </div>

        {vendors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vendors.map(vendor => (
              <Card key={vendor.id} className="bg-white/70 backdrop-blur-md border border-gray-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Store size={24} className="text-purple-600" />
                      {vendor.name}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => { setEditVendor(vendor); setShowDialog(true); }}>
                        <Edit size={16} />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => deleteVendorMutation.mutate(vendor.id)}>
                        <Trash size={16} />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-gray-700 text-sm">
                  <p className="flex items-center gap-2"><Tag size={16} />{vendor.category}</p>
                  <p className="flex items-center gap-2"><MapPin size={16} />{vendor.location}</p>
                  <p className="flex items-center gap-2"><Phone size={16} /><a href={`tel:${vendor.phone}`} className="underline">{vendor.phone}</a></p>
                  <p className="flex items-center gap-2"><Mail size={16} /><a href={`mailto:${vendor.email}`} className="underline">{vendor.email}</a></p>
                  {vendor.website && <p className="flex items-center gap-2"><Globe size={16} /><a href={vendor.website} target="_blank" rel="noopener noreferrer" className="underline">Website</a></p>}
                  <p className="text-gray-600 line-clamp-2">{vendor.description}</p>
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className={vendor.is_featured ? 'text-amber-500' : 'text-gray-400'} />
                    Featured: {vendor.is_featured ? 'Yes' : 'No'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">No vendors added yet. Click "Add New Vendor" to get started.</p>
        )}
      </main>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle>{editVendor ? 'Edit Vendor' : 'Add New Vendor'}</DialogTitle>
          </DialogHeader>
          <VendorForm vendor={editVendor} onSave={handleSaveVendor} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VendorForm({ vendor, onSave }) {
  const [formData, setFormData] = useState(vendor || {
    name: '',
    category: 'Venue',
    location: '',
    phone: '',
    email: '',
    website: '',
    description: '',
    is_featured: false,
    contact_person: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const categories = ['Venue', 'Caterer', 'Photographer', 'Decorator', 'Planner', 'Music/DJ', 'Attire', 'Officiant', 'Rentals', 'Other'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Vendor Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="category">Category</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
          <SelectTrigger id="category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="contact-person">Contact Person</Label>
        <Input
          id="contact-person"
          value={formData.contact_person}
          onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          type="url"
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="is_featured"
          checked={formData.is_featured}
          onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
        />
        <Label htmlFor="is_featured">Featured Vendor</Label>
      </div>
      <DialogFooter>
        <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
          {vendor ? 'Save Changes' : 'Add Vendor'}
        </Button>
      </DialogFooter>
    </form>
  );
}