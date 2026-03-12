import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Edit2, Plus, ExternalLink } from 'lucide-react';

export default function VendorManagement() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Food & Catering',
    location: '',
    state: '',
    country: 'USA',
    phone: '',
    email: '',
    website: '',
    description: '',
    image_url: '',
    is_featured: false,
    contact_person: '',
    specialties: []
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['admin-vendors'],
    queryFn: () => base44.entities.Vendor.list('-created_date', 200)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Vendor.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-vendors']);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Vendor.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-vendors']);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Vendor.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['admin-vendors'])
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Food & Catering',
      location: '',
      state: '',
      country: 'USA',
      phone: '',
      email: '',
      website: '',
      description: '',
      image_url: '',
      is_featured: false,
      contact_person: '',
      specialties: []
    });
    setEditingVendor(null);
    setShowForm(false);
  };

  const handleEdit = (vendor) => {
    setEditingVendor(vendor);
    setFormData(vendor);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (editingVendor) {
      updateMutation.mutate({ id: editingVendor.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({...formData, image_url: file_url});
    } catch (error) {
      alert('Photo upload failed');
    }
    setUploadingPhoto(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Vendor Management ({vendors.length})</CardTitle>
          <Button onClick={() => setShowForm(true)} className="bg-purple-600">
            <Plus size={16} className="mr-2" />
            Add Vendor
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {vendors.map(vendor => (
            <div key={vendor.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              {vendor.image_url && (
                <img
                  src={vendor.image_url}
                  alt={vendor.name}
                  className="w-16 h-16 rounded object-cover"
                />
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{vendor.name}</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <Badge variant="secondary">{vendor.category}</Badge>
                      <Badge variant="outline">{vendor.country}</Badge>
                      {vendor.state && <Badge variant="outline">{vendor.state}</Badge>}
                      {vendor.is_featured && <Badge className="bg-amber-500">Featured</Badge>}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{vendor.location}</p>
                    <p className="text-xs text-gray-500 mt-1">{vendor.email}</p>
                  </div>
                  <div className="flex gap-2">
                    {vendor.website && (
                      <a href={vendor.website} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm">
                          <ExternalLink size={16} />
                        </Button>
                      </a>
                    )}
                    <Button onClick={() => handleEdit(vendor)} variant="ghost" size="sm">
                      <Edit2 size={16} />
                    </Button>
                    <Button onClick={() => deleteMutation.mutate(vendor.id)} variant="destructive" size="sm">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Form Dialog */}
        <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Vendor Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Food & Catering">Food & Catering</SelectItem>
                      <SelectItem value="Photography & Video">Photography & Video</SelectItem>
                      <SelectItem value="Event Planning">Event Planning</SelectItem>
                      <SelectItem value="Venue">Venue</SelectItem>
                      <SelectItem value="Music & Entertainment">Music & Entertainment</SelectItem>
                      <SelectItem value="Beauty & Styling">Beauty & Styling</SelectItem>
                      <SelectItem value="Fashion & Attire">Fashion & Attire</SelectItem>
                      <SelectItem value="Decor & Flowers">Decor & Flowers</SelectItem>
                      <SelectItem value="Transportation">Transportation</SelectItem>
                      <SelectItem value="Rentals & Equipment">Rentals & Equipment</SelectItem>
                      <SelectItem value="Professional Services">Professional Services</SelectItem>
                      <SelectItem value="Health & Wellness">Health & Wellness</SelectItem>
                      <SelectItem value="Education & Training">Education & Training</SelectItem>
                      <SelectItem value="Home Services">Home Services</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="mt-2"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Photo</label>
                {formData.image_url && (
                  <img src={formData.image_url} alt="Vendor" className="w-full h-40 object-cover rounded-lg mb-2" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="mt-2"
                  disabled={uploadingPhoto}
                />
                {uploadingPhoto && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Location / City</label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="mt-2"
                    placeholder="e.g., Brooklyn, NY"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">State/Province</label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Country</label>
                <Select value={formData.country} onValueChange={(value) => setFormData({...formData, country: value})}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USA">USA</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Contact Person</label>
                  <Input
                    value={formData.contact_person}
                    onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Website</label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    className="mt-2"
                    placeholder="https://"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                  id="featured"
                />
                <label htmlFor="featured" className="text-sm">Featured Vendor</label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleSubmit} className="bg-purple-600">
                  {editingVendor ? 'Update' : 'Create'} Vendor
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}