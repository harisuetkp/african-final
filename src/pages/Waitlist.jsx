import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Send, CheckCircle, Mail, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import AfricanPattern from '@/components/shared/AfricanPattern';
import Logo from '@/components/shared/Logo';

export default function Waitlist() {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    location: '',
    reason: ''
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          setFormData(prev => ({
            ...prev,
            email: user.email || '',
            full_name: user.full_name || ''
          }));
        }
      } catch (e) {
        // Not logged in, that's fine
      }
    };
    fetchUser();
  }, []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Rate limiting - prevent spam (30 second cooldown)
    const now = Date.now();
    if (now - lastSubmitTime < 30000) {
      setError('Please wait before submitting again.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setLastSubmitTime(now);

    try {
      // Check if already on waitlist
      const existing = await base44.entities.WaitlistEntry.filter({ email: formData.email });
      if (existing.length > 0) {
        setIsSuccess(true); // Treat duplicate as success to avoid leaking info
        setIsSubmitting(false);
        return;
      }

      await base44.entities.WaitlistEntry.create({
        email: formData.email,
        full_name: formData.full_name,
        location: formData.location,
        reason: formData.reason,
        status: 'pending'
      });

      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-amber-50 flex items-center justify-center p-4 relative overflow-hidden">
        <AfricanPattern className="text-purple-600" opacity={0.05} />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full relative z-10"
        >
          <Card className="border-none shadow-2xl bg-white/90 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={40} className="text-green-600" />
              </div>
              
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">You're on the list!</h2>
                <p className="text-gray-600">
                  Thank you for joining the Afrinnect waitlist. We'll verify your spot and notify you as soon as we're ready for you!
                </p>
              </div>

              <div className="pt-4">
                <Link to={createPageUrl('Landing')}>
                  <Button variant="outline" className="w-full">
                    Back to Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-amber-50 flex flex-col relative overflow-hidden">
      <AfricanPattern className="text-purple-600" opacity={0.05} />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 p-6 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to={createPageUrl('Landing')}>
            <Logo />
          </Link>
          <Link to={createPageUrl('Landing')}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft size={16} /> Back
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 pt-20 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full"
        >
          <div className="text-center mb-8">
            <p className="text-sm md:text-base font-bold text-purple-600 uppercase tracking-widest mb-4">
              Finally a dating app for African people living abroad
            </p>
            <div className="inline-flex items-center justify-center p-2 bg-purple-100 text-purple-700 rounded-full mb-4 px-4 text-sm font-medium">
              <Sparkles size={16} className="mr-2" />
              Limited Spots Available
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight leading-none drop-shadow-sm uppercase">
              Warning: VIP Access <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-amber-600">Is Closing Soon!</span>
            </h1>
            <p className="text-xl font-bold text-gray-700 mb-4">
              Join our growing community. <span className="text-purple-600 bg-purple-50 px-2 py-1 rounded">Find meaningful connections.</span>
            </p>
          </div>

          <Card className="border-purple-100 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-gray-400" size={18} />
                    <Input 
                      id="full_name"
                      placeholder="Kwame Mensah" 
                      className="pl-10"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                <Label htmlFor="location">Where do you live? (City, Country)</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-gray-400" size={18} />
                  <Input 
                    id="location"
                    placeholder="Lagos, Ghana" 
                    className="pl-10"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
                </div>

                <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                    <Input 
                      id="email"
                      type="email" 
                      placeholder="kwame@example.com" 
                      className="pl-10"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">What brings you here? (Optional)</Label>
                  <Textarea 
                    id="reason"
                    placeholder="I'm looking for..." 
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    rows={3}
                  />
                </div>

                {/* GDPR Consent Checkbox */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={setAgreedToTerms}
                    className="mt-0.5"
                  />
                  <Label htmlFor="terms" className="text-sm text-gray-600 leading-tight cursor-pointer">
                    I agree to the{' '}
                    <Link to={createPageUrl('Terms')} className="text-purple-600 underline" target="_blank">Terms of Service</Link>
                    {' '}and{' '}
                    <Link to={createPageUrl('Privacy')} className="text-purple-600 underline" target="_blank">Privacy Policy</Link>
                    , and consent to the processing of my personal data.
                  </Label>
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-700 hover:to-amber-700 text-white shadow-lg py-6 text-lg"
                  disabled={isSubmitting || !agreedToTerms}
                >
                  {isSubmitting ? 'Joining...' : 'Join Waitlist'}
                  {!isSubmitting && <Send size={18} className="ml-2" />}
                </Button>
                
                <p className="text-xs text-center text-gray-500 mt-4">
                  We respect your privacy and will never share your data.
                </p>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}