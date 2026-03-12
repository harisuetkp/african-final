import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { 
  BarChart3, Users, Shield, TrendingUp, DollarSign, MessageSquare,
  Settings, Bell, Eye, LogOut, ChevronLeft, ChevronRight, Menu,
  Flag, Megaphone, Gift, Star, Zap, Globe, Book
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";

export default function AdminSidebar({ activePage, pendingReports = 0 }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const navItems = [
    { label: 'Overview', icon: BarChart3, page: 'AdminDashboard' },
    { label: 'Users', icon: Users, page: 'AdminUsers' },
    { label: 'Moderation', icon: Shield, page: 'AdminModeration', badge: pendingReports },
    { label: 'Analytics', icon: TrendingUp, page: 'AdminAnalytics' },
    { label: 'Subscriptions', icon: DollarSign, page: 'AdminSubscriptions' },
    { label: 'Ambassadors', icon: Star, page: 'AdminAmbassadors' },
    { label: 'Broadcast', icon: Megaphone, page: 'AdminBroadcast' },
    { label: 'Feature Flags', icon: Zap, page: 'AdminFeatureFlags' },
    { label: 'Settings', icon: Settings, page: 'AdminSettings' },
  ];

  const utilityItems = [
    { label: 'Admin Manual', icon: Book, page: 'AdminManual' },
  ];

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-64'} bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col h-screen sticky top-0`}>
      {/* Logo */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-white">Afrinnect</h1>
              <p className="text-xs text-slate-400">Admin Console</p>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-slate-400 hover:text-white"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.page}>
              <button
                onClick={() => navigate(createPageUrl(item.page))}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  activePage === item.page 
                    ? 'bg-orange-500/20 text-orange-400' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left text-sm">{item.label}</span>
                    {item.badge > 0 && (
                      <Badge className="bg-red-500 text-white text-xs">{item.badge}</Badge>
                    )}
                  </>
                )}
                {collapsed && item.badge > 0 && (
                  <span className="absolute right-2 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            </li>
          ))}
        </ul>

        {/* Utility Links */}
        {!collapsed && <div className="mt-4 pt-4 border-t border-slate-800">
          <p className="px-3 text-xs font-medium text-slate-500 uppercase mb-2">Resources</p>
        </div>}
        <ul className="space-y-1 mt-1">
          {utilityItems.map((item) => (
            <li key={item.page}>
              <button
                onClick={() => navigate(createPageUrl(item.page))}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  activePage === item.page 
                    ? 'bg-purple-500/20 text-purple-400' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="flex-1 text-left text-sm">{item.label}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* User */}
      <div className="p-4 border-t border-slate-800">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white font-medium flex-shrink-0">
                {user?.full_name?.[0] || 'A'}
              </div>
              {!collapsed && (
                <div className="flex-1 text-left overflow-hidden">
                  <p className="text-sm font-medium text-white truncate">{user?.full_name || 'Admin'}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800">
            <DropdownMenuItem 
              onClick={() => navigate(createPageUrl('Home'))} 
              className="text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <Eye className="w-4 h-4 mr-2" /> View App
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => navigate(createPageUrl('Discover'))} 
              className="text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <Globe className="w-4 h-4 mr-2" /> User Experience
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem 
              onClick={() => base44.auth.logout()} 
              className="text-red-400 hover:text-red-300 hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}