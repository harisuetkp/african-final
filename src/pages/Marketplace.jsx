import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ShoppingBag, MapPin, Filter, Search, Phone, ExternalLink, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AfricanPattern from '@/components/shared/AfricanPattern';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import EmptyState from '@/components/shared/EmptyState';

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [myProfile, setMyProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (profiles.length > 0) setMyProfile(profiles[0]);
      } catch (e) {}
    };
    fetchProfile();
  }, []);

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['marketplace-vendors'],
    queryFn: () => base44.entities.WeddingVendor.list('-is_featured'), // Featured first
    staleTime: 300000
  });

  const categories = ['Venue', 'Caterer', 'Photographer', 'Decorator', 'Planner', 'Music/DJ', 'Attire', 'Officiant', 'Rentals', 'Other'];

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          vendor.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || vendor.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-amber-50/20 relative pb-24">
      <AfricanPattern className="text-purple-600" opacity={0.03} />

      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3 mb-4">
                <Link to={createPageUrl('Home')}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft size={24} />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <ShoppingBag className="text-purple-600" />
                    Marketplace
                </h1>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input 
                        placeholder="Search vendors..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full md:w-48">
                        <div className="flex items-center gap-2">
                            <Filter size={16} />
                            <SelectValue placeholder="Category" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
            <LoadingSkeleton />
        ) : filteredVendors.length === 0 ? (
            <EmptyState 
                icon={ShoppingBag}
                title="No vendors found"
                description="Try adjusting your search or category filters"
                actionLabel="Reset Filters"
                onAction={() => { setSearchQuery(''); setCategoryFilter('all'); }}
            />
        ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVendors.map(vendor => (
                    <Card key={vendor.id} className="hover:shadow-lg transition-shadow group">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <Badge variant="outline" className="mb-2">{vendor.category}</Badge>
                                    <CardTitle className="text-xl group-hover:text-purple-600 transition-colors">
                                        {vendor.name}
                                    </CardTitle>
                                </div>
                                {vendor.is_featured && (
                                    <Badge className="bg-amber-500">Featured</Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 text-sm text-gray-600 mb-4">
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} className="text-gray-400" />
                                    {vendor.location}
                                </div>
                                {vendor.website && (
                                    <div className="flex items-center gap-2">
                                        <ExternalLink size={16} className="text-gray-400" />
                                        <a 
                                            href={vendor.website} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="hover:underline text-purple-600"
                                        >
                                            Visit Website
                                        </a>
                                    </div>
                                )}
                            </div>
                            
                            <p className="text-gray-600 line-clamp-3 mb-4 h-12">
                                {vendor.description}
                            </p>

                            <div className="grid grid-cols-2 gap-2">
                                <a href={`tel:${vendor.phone}`} className="w-full">
                                    <Button variant="outline" className="w-full">
                                        <Phone size={16} className="mr-2" />
                                        Call
                                    </Button>
                                </a>
                                <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => {
                                    alert("Messaging vendors is coming soon! Please call them directly for now.");
                                }}>
                                    Message
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )}
      </main>
    </div>
  );
}