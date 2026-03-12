import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MessageSquare, Plus, Clock, CheckCircle, Loader2,
  AlertCircle, ChevronRight, Send
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PrioritySupportBadge from '@/components/shared/PrioritySupportBadge';

const CATEGORIES = [
  { value: 'technical', label: 'Technical Issue', description: 'App crashes, bugs, or errors' },
  { value: 'account', label: 'Account', description: 'Login, profile, or verification issues' },
  { value: 'billing', label: 'Billing', description: 'Subscription, payments, or refunds' },
  { value: 'safety', label: 'Safety & Privacy', description: 'Report concerns or safety issues' },
  { value: 'feature_request', label: 'Feature Request', description: 'Suggest new features' },
  { value: 'other', label: 'Other', description: 'Anything else' }
];

export default function Support() {
  const [myProfile, setMyProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    subject: '',
    description: ''
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        if (userData) {
          const profiles = await base44.entities.UserProfile.filter({ user_id: userData.id });
          if (profiles.length > 0) {
            setMyProfile(profiles[0]);
          }
        }
      } catch (e) {
        console.log('Not logged in');
      }
    };
    fetchData();
  }, []);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['support-tickets', user?.id],
    queryFn: () => base44.entities.SupportTicket.filter({ user_id: user.id }, '-created_date'),
    enabled: !!user
  });

  const createTicketMutation = useMutation({
    mutationFn: (data) => {
      const tier = myProfile?.subscription_tier || 'free';
      
      // Set priority based on tier
      const priorityMap = {
        vip: 'urgent',
        elite: 'high',
        premium: 'high',
        free: data.category === 'billing' || data.category === 'safety' ? 'high' : 'medium'
      };
      
      return base44.entities.SupportTicket.create({
        user_id: user.id,
        user_email: user.email,
        category: data.category,
        subject: data.subject,
        description: data.description,
        status: 'open',
        priority: priorityMap[tier] || 'medium'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      setShowNewTicket(false);
      setFormData({ category: '', subject: '', description: '' });
    }
  });

  const handleSubmit = () => {
    if (!formData.category || !formData.subject || !formData.description) {
      alert('Please fill in all fields');
      return;
    }
    createTicketMutation.mutate(formData);
  };

  const statusConfig = {
    open: { color: 'bg-blue-100 text-blue-700', icon: Clock, label: 'Open' },
    in_progress: { color: 'bg-purple-100 text-purple-700', icon: Loader2, label: 'In Progress' },
    waiting: { color: 'bg-amber-100 text-amber-700', icon: AlertCircle, label: 'Waiting for Response' },
    resolved: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Resolved' },
    closed: { color: 'bg-gray-100 text-gray-600', icon: CheckCircle, label: 'Closed' }
  };

  const openTickets = tickets.filter(t => ['open', 'in_progress', 'waiting'].includes(t.status));
  const closedTickets = tickets.filter(t => ['resolved', 'closed'].includes(t.status));

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Settings')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft size={24} />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold">Support</h1>
              <PrioritySupportBadge userTier={myProfile?.subscription_tier} />
            </div>
          </div>
          <Button onClick={() => setShowNewTicket(true)} size="sm" className="bg-purple-600 hover:bg-purple-700">
            <Plus size={16} className="mr-1" />
            New Ticket
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Quick Help */}
        <div className="bg-gradient-to-br from-purple-50 to-amber-50 rounded-xl p-6 mb-6 border border-purple-100">
          <h2 className="font-bold text-lg mb-2">Need Quick Help?</h2>
          <div className="space-y-2">
            <Link to={createPageUrl('CommunityGuidelines')} className="flex items-center gap-2 text-purple-700 text-sm hover:underline">
              <ChevronRight size={16} />
              Community Guidelines
            </Link>
            <Link to={createPageUrl('Terms')} className="flex items-center gap-2 text-purple-700 text-sm hover:underline">
              <ChevronRight size={16} />
              Terms of Service
            </Link>
            <Link to={createPageUrl('Privacy')} className="flex items-center gap-2 text-purple-700 text-sm hover:underline">
              <ChevronRight size={16} />
              Privacy Policy
            </Link>
          </div>
        </div>

        {/* Tickets */}
        <Tabs defaultValue="open" className="space-y-4">
          <TabsList className="w-full">
            <TabsTrigger value="open" className="flex-1">
              Open ({openTickets.length})
            </TabsTrigger>
            <TabsTrigger value="closed" className="flex-1">
              Closed ({closedTickets.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="space-y-3">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="animate-spin mx-auto mb-2 text-purple-600" size={32} />
                <p className="text-gray-500">Loading tickets...</p>
              </div>
            ) : openTickets.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-4">No open tickets</p>
                  <Button onClick={() => setShowNewTicket(true)} variant="outline">
                    Create Your First Ticket
                  </Button>
                </CardContent>
              </Card>
            ) : (
              openTickets.map((ticket) => {
                const StatusIcon = statusConfig[ticket.status].icon;
                return (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{ticket.subject}</h3>
                            <p className="text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {CATEGORIES.find(c => c.value === ticket.category)?.label}
                            </Badge>
                            <Badge className={`${statusConfig[ticket.status].color} text-xs`}>
                              <StatusIcon size={12} className="mr-1" />
                              {statusConfig[ticket.status].label}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(ticket.created_date).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="closed" className="space-y-3">
            {closedTickets.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No closed tickets</p>
                </CardContent>
              </Card>
            ) : (
              closedTickets.map((ticket) => (
                <Card key={ticket.id} className="opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{ticket.subject}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <Badge className="bg-green-100 text-green-700 text-xs">
                        <CheckCircle size={12} className="mr-1" />
                        Resolved
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(ticket.created_date).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Contact Info */}
        <Card className="mt-6 bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-6 text-center">
            <h3 className="font-bold mb-2">Need Urgent Help?</h3>
            <p className="text-sm text-gray-600 mb-4">
              For urgent safety concerns, email us directly at
            </p>
            <a href="mailto:support@afrinnect.com" className="text-purple-600 font-semibold hover:underline">
              support@afrinnect.com
            </a>
          </CardContent>
        </Card>
      </main>

      {/* New Ticket Dialog */}
      <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>
              {myProfile?.subscription_tier && myProfile.subscription_tier !== 'free' 
                ? '⚡ Your ticket will be prioritized! We typically respond within 2-6 hours.'
                : 'Tell us what you need help with and we\'ll get back to you within 24 hours'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="mb-2 block">Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div>
                        <div className="font-medium">{cat.label}</div>
                        <div className="text-xs text-gray-500">{cat.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Subject</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                placeholder="Brief description of your issue"
              />
            </div>

            <div>
              <Label className="mb-2 block">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Please provide as much detail as possible..."
                rows={5}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={createTicketMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {createTicketMutation.isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={18} className="mr-2" />
                  Submit Ticket
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}