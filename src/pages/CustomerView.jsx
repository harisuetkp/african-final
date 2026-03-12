import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, Smartphone, Monitor, User, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from '@tanstack/react-query';

export default function CustomerView() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewMode, setViewMode] = useState('mobile');
  const [selectedPage, setSelectedPage] = useState(null);
  const [impersonateUserId, setImpersonateUserId] = useState(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = await base44.auth.me();
        if (user && user.email === 'pivotngoyb@gmail.com') {
          setIsAdmin(true);
        } else {
          window.location.href = createPageUrl('Home');
        }
      } catch (e) {
        window.location.href = createPageUrl('Landing');
      }
    };
    checkAdmin();
  }, []);

  // Fetch all user profiles for impersonation
  const { data: profiles = [] } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: () => base44.entities.UserProfile.list('-created_date', 100),
    enabled: isAdmin
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  const pages = [
    { name: 'Landing', label: 'Landing Page', icon: '🏠', needsAuth: false },
    { name: 'LegalAcceptance', label: 'Legal Acceptance', icon: '📋', needsAuth: true },
    { name: 'Onboarding', label: 'Onboarding', icon: '👋', needsAuth: true },
    { name: 'Home', label: 'Discovery Feed', icon: '🔍', needsAuth: true },
    { name: 'Matches', label: 'Matches & Likes', icon: '💕', needsAuth: true },
    { name: 'Notifications', label: 'Notifications', icon: '🔔', needsAuth: true },
    { name: 'Events', label: 'Events', icon: '🎉', needsAuth: true },
    { name: 'Profile', label: 'User Profile', icon: '👤', needsAuth: true },
    { name: 'EditProfile', label: 'Edit Profile', icon: '✏️', needsAuth: true },
    { name: 'Settings', label: 'Settings', icon: '⚙️', needsAuth: true },
    { name: 'PricingPlans', label: 'Pricing Plans', icon: '👑', needsAuth: true },
    { name: 'Chat', label: 'Chat', icon: '💬', needsAuth: true }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl('AdminDashboard')}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft size={24} />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Customer View</h1>
                <p className="text-sm text-gray-500">Preview and test the user experience</p>
              </div>
            </div>

            <Tabs value={viewMode} onValueChange={setViewMode}>
              <TabsList>
                <TabsTrigger value="mobile" className="gap-2">
                  <Smartphone size={18} />
                  Mobile
                </TabsTrigger>
                <TabsTrigger value="desktop" className="gap-2">
                  <Monitor size={18} />
                  Desktop
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Impersonation Selector */}
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <User size={20} className="text-amber-600" />
                <div className="flex-1">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Impersonate User (Optional)
                  </Label>
                  <Select value={impersonateUserId || 'none'} onValueChange={(val) => setImpersonateUserId(val === 'none' ? null : val)}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="View as admin (no user selected)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">👨‍💼 Admin View (No Impersonation)</SelectItem>
                      {profiles.map(profile => (
                        <SelectItem key={profile.id} value={profile.user_id}>
                          {profile.display_name} ({profile.current_city})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {impersonateUserId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setImpersonateUserId(null)}
                    className="text-gray-500"
                  >
                    Clear
                  </Button>
                )}
              </div>
              <p className="text-xs text-amber-700 mt-2">
                {impersonateUserId 
                  ? '⚠️ Viewing as selected user - you\'ll see their data and permissions'
                  : 'ℹ️ Currently viewing as admin - select a user to test their exact experience'}
              </p>
            </CardContent>
          </Card>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {pages.map((page, idx) => (
            <motion.div
              key={page.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <div
                onClick={() => setSelectedPage(page)}
                className="bg-white rounded-xl border-2 border-gray-200 hover:border-purple-400 hover:shadow-lg transition-all p-4 cursor-pointer group h-full"
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="text-3xl">{page.icon}</div>
                  <h3 className="font-semibold text-gray-900 text-sm">{page.label}</h3>
                  {page.needsAuth && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      Requires Login
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-bold text-blue-900 mb-2">💡 Preview Mode</h3>
            <p className="text-blue-800 text-sm mb-3">
              Click any page to preview it in an embedded iframe. See exactly what users see!
            </p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Switch between mobile and desktop views</li>
              <li>• Impersonate users to test their experience</li>
              <li>• All changes are live - test in real-time</li>
            </ul>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
            <h3 className="font-bold text-purple-900 mb-2">🎭 Impersonation Tips</h3>
            <p className="text-purple-800 text-sm mb-3">
              Select a user to see their exact view, data, and permissions.
            </p>
            <ul className="text-xs text-purple-700 space-y-1">
              <li>• Test different user types (free/premium)</li>
              <li>• Check location-specific features</li>
              <li>• Verify privacy and data isolation</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Page Preview Modal */}
      {selectedPage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`bg-white rounded-2xl shadow-2xl overflow-hidden ${
              viewMode === 'mobile' ? 'w-[375px] h-[667px]' : 'w-full max-w-6xl h-[80vh]'
            }`}
          >
            {/* Preview Header */}
            <div className="bg-gray-100 border-b px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedPage.icon}</span>
                <div>
                  <h3 className="font-bold text-gray-900">{selectedPage.label}</h3>
                  <p className="text-xs text-gray-500">
                    {impersonateUserId ? 'Viewing as selected user' : 'Admin view'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedPage(null)}
                className="hover:bg-gray-200"
              >
                <X size={20} />
              </Button>
            </div>

            {/* Iframe Preview */}
            <div className="w-full h-full bg-gray-50">
              <iframe
                src={impersonateUserId 
                  ? `${createPageUrl(selectedPage.name)}?_impersonate=${impersonateUserId}`
                  : createPageUrl(selectedPage.name)
                }
                className="w-full h-full border-0"
                title={`Preview of ${selectedPage.label}`}
              />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}