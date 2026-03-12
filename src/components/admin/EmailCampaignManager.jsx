import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Mail, Send, Users, Loader2, FileText, Sparkles, Copy } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const EMAIL_TEMPLATES = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    subject: 'Welcome to Afrinnect! 🎉',
    body: `Hi {name}!

Welcome to Afrinnect - the premier dating platform for African singles and diaspora worldwide.

Here are some tips to get started:
• Complete your profile with photos and a bio
• Set your preferences to find compatible matches
• Send your first like to break the ice!

We're excited to have you in our community.

Warm regards,
The Afrinnect Team`
  },
  {
    id: 'inactive',
    name: 'Re-engagement',
    subject: "We miss you, {name}! 💕",
    body: `Hi {name},

We noticed you haven't been on Afrinnect lately. Your perfect match might be waiting!

Since you've been gone:
• {new_members} new members have joined
• Our AI matching has gotten even smarter
• New community events are happening

Come back and see what you've been missing!

Best,
The Afrinnect Team`
  },
  {
    id: 'premium_promo',
    name: 'Premium Promotion',
    subject: 'Unlock unlimited matches with Premium! ⭐',
    body: `Hi {name},

Ready to take your dating experience to the next level?

With Afrinnect Premium, you get:
✓ Unlimited likes
✓ See who likes you
✓ Advanced filters by tribe, religion, and more
✓ Priority support

For a limited time, get 20% off your first month!

Upgrade now and find your perfect match faster.

Best,
The Afrinnect Team`
  },
  {
    id: 'event',
    name: 'Event Announcement',
    subject: 'Join our upcoming event! 📅',
    body: `Hi {name},

We're hosting a special event for our community!

[Event Details Here]

Don't miss this chance to meet amazing people from our community.

RSVP in the app today!

See you there,
The Afrinnect Team`
  },
  {
    id: 'safety',
    name: 'Safety Reminder',
    subject: 'Stay safe on Afrinnect 🛡️',
    body: `Hi {name},

Your safety is our top priority. Here are some reminders:

• Never share personal information too quickly
• Video chat before meeting in person
• Always meet in public places
• Trust your instincts

Report any suspicious behavior directly in the app.

Stay safe,
The Afrinnect Safety Team`
  }
];

export default function EmailCampaignManager() {
  const [campaign, setCampaign] = useState({
    campaign_title: '',
    subject: '',
    body: '',
    target_audience: 'all'
  });
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const sendCampaignMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('sendNewsletterEmail', data),
    onSuccess: (result) => {
      alert(`Campaign sent! ${result.data.sent} emails delivered to ${result.data.targeted} users.`);
      setCampaign({ campaign_title: '', subject: '', body: '', target_audience: 'all' });
    },
    onError: (error) => {
      alert('Failed to send campaign: ' + error.message);
    }
  });

  const applyTemplate = (template) => {
    setSelectedTemplate(template.id);
    setCampaign({
      ...campaign,
      subject: template.subject,
      body: template.body,
      campaign_title: template.name
    });
  };

  return (
    <div className="space-y-6">
      {/* Templates Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText size={20} />
            Email Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {EMAIL_TEMPLATES.map(template => (
              <button
                key={template.id}
                onClick={() => applyTemplate(template)}
                className={`p-3 rounded-lg border text-left transition-all hover:shadow-md ${
                  selectedTemplate === template.id 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <p className="font-medium text-sm text-gray-900">{template.name}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{template.subject}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Campaign Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail size={20} />
            Email Campaign Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Campaign Title</Label>
              <Input
                value={campaign.campaign_title}
                onChange={(e) => setCampaign({ ...campaign, campaign_title: e.target.value })}
                placeholder="Internal campaign name"
              />
            </div>

            <div>
              <Label>Target Audience</Label>
              <Select 
                value={campaign.target_audience}
                onValueChange={(v) => setCampaign({ ...campaign, target_audience: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users size={16} />
                      All Active Users
                    </div>
                  </SelectItem>
                  <SelectItem value="premium">Premium Users Only</SelectItem>
                  <SelectItem value="free">Free Users Only</SelectItem>
                  <SelectItem value="inactive">Inactive (7+ days)</SelectItem>
                  <SelectItem value="founding_members">Founding Members</SelectItem>
                  <SelectItem value="new_users">New Users (Last 7 days)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Email Subject</Label>
            <Input
              value={campaign.subject}
              onChange={(e) => setCampaign({ ...campaign, subject: e.target.value })}
              placeholder="What users will see in their inbox"
            />
          </div>

          <div>
            <Label>Email Body</Label>
            <Textarea
              value={campaign.body}
              onChange={(e) => setCampaign({ ...campaign, body: e.target.value })}
              placeholder="Write your message..."
              className="h-48 font-mono text-sm"
            />
            <div className="flex items-center gap-4 mt-2">
              <p className="text-xs text-gray-500">
                Variables: <code className="bg-gray-100 px-1 rounded">{'{name}'}</code> = User's name
              </p>
              <Badge variant="outline" className="text-xs">
                <Sparkles size={12} className="mr-1" />
                Personalized per user
              </Badge>
            </div>
          </div>

          {/* Preview */}
          {campaign.body && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                <Mail size={12} /> Preview
              </p>
              <p className="font-medium text-gray-900 mb-2">{campaign.subject || 'No subject'}</p>
              <div className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border">
                {campaign.body.replace('{name}', 'John')}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => sendCampaignMutation.mutate(campaign)}
              disabled={!campaign.subject || !campaign.body || sendCampaignMutation.isPending}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {sendCampaignMutation.isPending ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Sending Campaign...
                </>
              ) : (
                <>
                  <Send size={18} className="mr-2" />
                  Send Campaign
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCampaign({ campaign_title: '', subject: '', body: '', target_audience: 'all' });
                setSelectedTemplate(null);
              }}
            >
              Clear
            </Button>
          </div>

          {sendCampaignMutation.isSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              ✓ Campaign sent successfully!
            </div>
          )}

          {sendCampaignMutation.isError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              ✗ {sendCampaignMutation.error?.message || 'Failed to send campaign'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}