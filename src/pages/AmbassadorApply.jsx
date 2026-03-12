import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { 
  Crown, DollarSign, Users, TrendingUp, CheckCircle, 
  Loader2, ArrowRight, Gift, Target, Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from 'sonner';

export default function AmbassadorApply() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [existingAmbassador, setExistingAmbassador] = useState(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    handle: '',
    display_name: '',
    email: '',
    phone: '',
    country: '',
    bio: '',
    social_links: {
      instagram: '',
      tiktok: '',
      youtube: '',
      twitter: ''
    },
    audience_size: '',
    how_promote: '',
    terms_accepted: false
  });

  useEffect(() => {
    const checkUser = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        setFormData(prev => ({ ...prev, email: u.email, display_name: u.full_name }));
        
        // Check if already an ambassador
        const ambassadors = await base44.entities.Ambassador.filter({ email: u.email });
        if (ambassadors.length > 0) {
          setExistingAmbassador(ambassadors[0]);
        }
      } catch (e) {
        // Not logged in - redirect to login
        base44.auth.redirectToLogin(window.location.href);
      }
    };
    checkUser();
  }, []);

  const applyMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('ambassadorApply', formData);
      if (response.data.error) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: (data) => {
      setStep(3);
      toast.success('Application submitted!');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const benefits = [
    { icon: DollarSign, title: 'Earn Commission', desc: 'Up to $15 per premium subscriber' },
    { icon: Gift, title: 'Recurring Revenue', desc: 'Earn on renewals for 6 months' },
    { icon: Target, title: 'Milestone Bonuses', desc: 'Extra rewards at 10, 50, 100 referrals' },
    { icon: Sparkles, title: 'Exclusive Perks', desc: 'Free premium, early features, swag' }
  ];

  // Already an ambassador
  if (existingAmbassador) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-amber-50 p-4">
        <div className="max-w-lg mx-auto pt-12">
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">You're Already an Ambassador!</h2>
              <p className="text-gray-600 mb-4">
                Status: <span className="font-semibold capitalize">{existingAmbassador.status}</span>
              </p>
              <Link to={createPageUrl('AmbassadorPortal')}>
                <Button className="w-full">Go to Ambassador Portal</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Success step
  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-amber-50 p-4">
        <div className="max-w-lg mx-auto pt-12">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <Card>
              <CardContent className="pt-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
                <p className="text-gray-600 mb-6">
                  We'll review your application and get back to you within 24-48 hours. 
                  You'll receive an email at <strong>{formData.email}</strong> when approved.
                </p>
                <Link to={createPageUrl('Home')}>
                  <Button>Back to Home</Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-amber-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-purple-700 to-amber-600 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Crown className="mx-auto h-16 w-16 mb-4" />
          <h1 className="text-4xl font-bold mb-4">Become an Afrinnect Ambassador</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Join our ambassador program and earn money while helping African singles find love worldwide.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Benefits */}
            <div className="grid md:grid-cols-4 gap-4 mb-12">
              {benefits.map((benefit, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6 text-center">
                    <benefit.icon className="mx-auto h-8 w-8 text-purple-600 mb-3" />
                    <h3 className="font-semibold mb-1">{benefit.title}</h3>
                    <p className="text-sm text-gray-500">{benefit.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* How it works */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 text-purple-600 font-bold">1</div>
                    <h4 className="font-semibold mb-1">Apply</h4>
                    <p className="text-sm text-gray-500">Fill out the application form</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 text-purple-600 font-bold">2</div>
                    <h4 className="font-semibold mb-1">Get Approved</h4>
                    <p className="text-sm text-gray-500">We'll review and approve within 48h</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 text-purple-600 font-bold">3</div>
                    <h4 className="font-semibold mb-1">Start Earning</h4>
                    <p className="text-sm text-gray-500">Share your link and earn commissions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button size="lg" onClick={() => setStep(2)} className="gap-2">
                Apply Now <ArrowRight size={18} />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Ambassador Application</CardTitle>
                <CardDescription>Tell us about yourself</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Your Handle (username)*</Label>
                    <Input
                      value={formData.handle}
                      onChange={(e) => setFormData({ ...formData, handle: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
                      placeholder="e.g., joelle"
                    />
                    <p className="text-xs text-gray-500 mt-1">Your referral code will be: AMBA_{formData.handle.toUpperCase() || 'YOURNAME'}</p>
                  </div>
                  <div>
                    <Label>Display Name*</Label>
                    <Input
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Email*</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Phone (optional)</Label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Country*</Label>
                  <Select value={formData.country} onValueChange={(v) => setFormData({ ...formData, country: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="FR">France</SelectItem>
                      <SelectItem value="NG">Nigeria</SelectItem>
                      <SelectItem value="GH">Ghana</SelectItem>
                      <SelectItem value="KE">Kenya</SelectItem>
                      <SelectItem value="ZA">South Africa</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>About You</Label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself and why you want to be an ambassador..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label className="mb-3 block">Social Media (at least one)</Label>
                  <div className="grid md:grid-cols-2 gap-3">
                    <Input
                      placeholder="Instagram @username"
                      value={formData.social_links.instagram}
                      onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, instagram: e.target.value } })}
                    />
                    <Input
                      placeholder="TikTok @username"
                      value={formData.social_links.tiktok}
                      onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, tiktok: e.target.value } })}
                    />
                    <Input
                      placeholder="YouTube channel"
                      value={formData.social_links.youtube}
                      onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, youtube: e.target.value } })}
                    />
                    <Input
                      placeholder="Twitter/X @username"
                      value={formData.social_links.twitter}
                      onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, twitter: e.target.value } })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Estimated Audience Size</Label>
                  <Select value={formData.audience_size} onValueChange={(v) => setFormData({ ...formData, audience_size: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Less than 1,000</SelectItem>
                      <SelectItem value="medium">1,000 - 10,000</SelectItem>
                      <SelectItem value="large">10,000 - 100,000</SelectItem>
                      <SelectItem value="xlarge">100,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>How will you promote Afrinnect?</Label>
                  <Textarea
                    value={formData.how_promote}
                    onChange={(e) => setFormData({ ...formData, how_promote: e.target.value })}
                    placeholder="e.g., Instagram stories, YouTube videos, blog posts..."
                    rows={2}
                  />
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.terms_accepted}
                    onCheckedChange={(checked) => setFormData({ ...formData, terms_accepted: checked })}
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600">
                    I agree to the <Link to={createPageUrl('Terms')} className="text-purple-600 underline">Ambassador Terms & Conditions</Link> and understand that commissions are subject to a 14-day hold period.
                  </label>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => applyMutation.mutate()}
                    disabled={!formData.handle || !formData.email || !formData.country || !formData.terms_accepted || applyMutation.isPending}
                  >
                    {applyMutation.isPending && <Loader2 className="animate-spin mr-2" size={18} />}
                    Submit Application
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}