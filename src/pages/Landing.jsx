import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Shield, Globe, Sparkles, Users, CheckCircle, Crown, ArrowRight, Star, MessageCircle, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Logo from '@/components/shared/Logo';
import AfricanPattern from '@/components/shared/AfricanPattern';
import { useLanguage } from '@/components/i18n/LanguageContext';
import LanguageSelector from '@/components/i18n/LanguageSelector';
import { useConversionTracker, CONVERSION_EVENTS } from '@/components/shared/ConversionTracker';
import SEOHead from '@/components/seo/SEOHead';

export default function Landing() {
  const { t } = useLanguage();
  const { trackEvent } = useConversionTracker();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [liveCount, setLiveCount] = useState(47);
  const [recentSignup, setRecentSignup] = useState(null);

  useEffect(() => {
    trackEvent(CONVERSION_EVENTS.LANDING_VIEW);
    base44.auth.isAuthenticated().then(setIsLoggedIn).catch(() => {});
    
    // Simulate live activity (realistic numbers)
    const liveInterval = setInterval(() => {
      setLiveCount(prev => prev + Math.floor(Math.random() * 3) - 1);
    }, 8000);
    
    // Show recent signup notifications
    const signups = [
      { name: "Amara", location: "Atlanta", time: "2 min ago" },
      { name: "Kwesi", location: "London", time: "5 min ago" },
      { name: "Fatou", location: "Paris", time: "8 min ago" },
      { name: "David", location: "Toronto", time: "12 min ago" },
    ];
    let idx = 0;
    const showSignup = () => {
      setRecentSignup(signups[idx % signups.length]);
      idx++;
      setTimeout(() => setRecentSignup(null), 4000);
    };
    showSignup();
    const signupInterval = setInterval(showSignup, 15000);
    
    return () => {
      clearInterval(liveInterval);
      clearInterval(signupInterval);
    };
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Heart,
      title: t('landing.features.cultural.title'),
      description: t('landing.features.cultural.desc')
    },
    {
      icon: Shield,
      title: t('landing.features.safety.title'),
      description: t('landing.features.safety.desc')
    },
    {
      icon: Globe,
      title: t('landing.features.global.title'),
      description: t('landing.features.global.desc')
    },
    {
      icon: Sparkles,
      title: t('landing.features.smart.title'),
      description: t('landing.features.smart.desc')
    }
  ];

  const stats = [
    { number: "🇺🇸 🇨🇦", label: "USA & Canada" },
    { number: "24/7", label: "Active Community" },
    { number: "Free", label: "To Get Started" },
    { number: "100%", label: "Culture-Focused" }
  ];

  const testimonials = [
    {
      name: "Amara & Kwame",
      location: "Met on Afrinnect • Now Engaged",
      image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6940c70dbf312aa4658a9066/4aa15e12a_image.png",
      secondImage: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6940c70dbf312aa4658a9066/a4c7689a9_image.png",
      quote: "I almost didn't sign up. I'd been disappointed by other apps. But Afrinnect was different - Kwame understood my values from day one. We're planning our traditional wedding next month!",
      detail: "Connected through shared Igbo heritage"
    },
    {
      name: "Zara & Malik",
      location: "Met on Afrinnect • Together 18 months",
      image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6940c70dbf312aa4658a9066/4a4914d37_image.png",
      secondImage: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6940c70dbf312aa4658a9066/600f3567c_image.png",
      quote: "I was skeptical about dating apps. My friend convinced me to try Afrinnect for just one week. I met Malik on day 3. Best decision I ever made.",
      detail: "Bonded over East African culture"
    },
    {
      name: "Thandiwe & David",
      location: "Met on Afrinnect • Married 2024",
      image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6940c70dbf312aa4658a9066/aa7b7d0ce_image.png",
      secondImage: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6940c70dbf312aa4658a9066/9c6bf76a1_image.png",
      quote: "Other apps made me feel invisible. On Afrinnect, I felt celebrated. David messaged me about my bio mentioning Ubuntu philosophy - we talked for 6 hours that first night.",
      detail: "Matched through shared values"
    }
  ];

  const communityPhotos = [
    "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6940c70dbf312aa4658a9066/4aa15e12a_image.png",
    "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6940c70dbf312aa4658a9066/a4c7689a9_image.png",
    "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6940c70dbf312aa4658a9066/4a4914d37_image.png",
    "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6940c70dbf312aa4658a9066/600f3567c_image.png",
    "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6940c70dbf312aa4658a9066/aa7b7d0ce_image.png",
    "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6940c70dbf312aa4658a9066/9c6bf76a1_image.png"
  ];

  const handleGetStarted = async () => {
    // No location gate - let users sign up first, verify location during onboarding
    trackEvent(CONVERSION_EVENTS.SIGNUP_START);
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    const nextUrl = ref ? createPageUrl('Onboarding') + `?ref=${ref}` : createPageUrl('Onboarding');
    base44.auth.redirectToLogin(window.location.origin + nextUrl);
  };

  const handleLogin = async () => {
    // No location gate - verify during onboarding
    trackEvent(CONVERSION_EVENTS.SIGNUP_START);
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    const nextUrl = ref ? createPageUrl('Home') + `?ref=${ref}` : createPageUrl('Home');
    base44.auth.redirectToLogin(window.location.origin + nextUrl);
  };

  return (
    <>
      <SEOHead
        title="Afrinnect - Connect with African Singles Worldwide"
        description="Find meaningful relationships with African singles and diaspora worldwide. Join 10K+ members in 50+ countries for cultural dating based on shared heritage."
        keywords="african dating, black dating, african singles, diaspora dating, african culture, ethnic dating"
      />
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-amber-900 relative overflow-hidden">
        <AfricanPattern className="text-white" opacity={0.08} />

      {/* Navigation */}
      <nav className="relative z-10 bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="relative group cursor-pointer">
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter transform -skew-x-6 transition-all duration-300 group-hover:skew-x-0">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-yellow-300 via-amber-500 to-orange-600 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.5)]" style={{ WebkitTextStroke: '1px white' }}>
                AFRINNECT
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            {isLoggedIn ? (
              <Link to={createPageUrl('Home')}>
                <Button 
                  variant="ghost" 
                  className="text-white hover:bg-white/20 font-semibold"
                >
                  Go to App →
                </Button>
              </Link>
            ) : (
              <Button 
                onClick={handleLogin}
                variant="ghost" 
                className="text-white hover:bg-white/20"
              >
                {t('landing.login')}
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Recent Signup Notification - Social Proof */}
      <AnimatePresence>
        {recentSignup && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed bottom-24 md:bottom-8 left-4 z-50 bg-white rounded-xl shadow-2xl p-4 flex items-center gap-3 max-w-xs"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-amber-500 rounded-full flex items-center justify-center text-white font-bold">
              {recentSignup.name[0]}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{recentSignup.name} just joined!</p>
              <p className="text-xs text-gray-500">{recentSignup.location} • {recentSignup.time}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-left"
          >
            {/* Live Activity Badge */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-lg border border-white/20 px-4 py-2 rounded-full mb-6"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-white/90 text-sm font-medium">{liveCount} people exploring profiles right now</span>
            </motion.div>

            {/* Logo */}
            <div className="mb-6">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6940c70dbf312aa4658a9066/539bcd82a_EA8B1C93-B120-4D4F-A79F-9725395A9A37.png"
                alt="Afrinnect"
                className="h-20 md:h-28 w-auto"
              />
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              Your Future Partner<br />
              <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
                Is Already Here
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-4 max-w-xl">
              The only dating app built for the African diaspora in North America. Find someone who truly gets your culture, values, and dreams.
            </p>
            
            {/* Geographic notice */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-4 py-2 mb-4">
              <span className="text-xl">🇺🇸 🇨🇦</span>
              <span className="text-white/90 text-sm">Currently available in USA & Canada</span>
            </div>
            
            {/* Urgency Message */}
            <div className="bg-amber-500/20 border border-amber-400/30 rounded-xl p-4 mb-6">
              <p className="text-amber-200 text-sm font-medium">
                🎉 <strong>Founding Member Bonus:</strong> Sign up this week and get Premium features FREE for 30 days
              </p>
            </div>
            
            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {isLoggedIn ? (
                <Link to={createPageUrl('Home')}>
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-10 py-6 text-lg rounded-full shadow-2xl"
                  >
                    Welcome Back! Go to App
                    <ArrowRight size={20} className="ml-2" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Button 
                    onClick={handleGetStarted}
                    size="lg" 
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-10 py-7 text-lg rounded-full shadow-2xl transform hover:scale-105 transition-all"
                  >
                    Find Your Match — It's Free
                    <ArrowRight size={20} className="ml-2" />
                  </Button>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-400" />
                <span>100% Free to join</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-400" />
                <span>2 min setup</span>
              </div>
            </div>
          </motion.div>

          {/* Right: Photo Grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Main large image */}
            <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6940c70dbf312aa4658a9066/0129c1998_ai-generated-8702314_1280.jpg"
                alt="African community"
                className="w-full h-[500px] md:h-[600px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex -space-x-3">
                    {communityPhotos.slice(0, 4).map((photo, idx) => (
                      <img
                        key={idx}
                        src={photo}
                        alt=""
                        className="w-10 h-10 rounded-full border-2 border-white object-cover"
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">+10,000 members</span>
                </div>
                <p className="text-lg font-semibold">Find your perfect match today</p>
              </div>
            </div>

            {/* Floating cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="absolute -left-8 top-12 z-20 bg-white rounded-2xl p-4 shadow-xl"
            >
              <div className="flex items-center gap-3">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6940c70dbf312aa4658a9066/728ada3a8_image.png"
                  alt=""
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-bold text-gray-900 text-sm">New Match! 💕</p>
                  <p className="text-xs text-gray-500">Kwame from Ghana</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="absolute -right-8 bottom-24 z-20 bg-white rounded-2xl p-4 shadow-xl"
            >
              <div className="flex items-center gap-3">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6940c70dbf312aa4658a9066/728ada3a8_image.png"
                  alt=""
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-bold text-gray-900 text-sm">94% Match 🎯</p>
                  <p className="text-xs text-gray-500">Zara from Kenya</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16"
        >
          {stats.map((stat, idx) => (
            <Card key={idx} className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-5 text-center">
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.number}</div>
                <div className="text-white/70 text-xs md:text-sm">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t('landing.whyChoose')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('landing.whySubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-xl transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-amber-100 flex items-center justify-center">
                      <feature.icon size={32} className="text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories - Emotional Social Proof */}
      <section className="relative z-10 bg-gradient-to-br from-purple-50 to-amber-50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block bg-purple-100 text-purple-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              Real Stories, Real Couples
            </span>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              They Almost Didn't Sign Up...
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Every love story starts with a single decision. These couples took the leap.
            </p>
          </div>

          {/* Testimonial Carousel - Enhanced */}
          <div className="max-w-4xl mx-auto mb-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="bg-white shadow-2xl border-0 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      {/* Couple Photos */}
                      <div className="md:w-2/5 bg-gradient-to-br from-purple-100 to-amber-100 p-8 flex items-center justify-center">
                        <div className="relative">
                          <img
                            src={testimonials[activeTestimonial].image}
                            alt=""
                            className="w-28 h-28 rounded-full object-cover shadow-lg border-4 border-white"
                          />
                          <img
                            src={testimonials[activeTestimonial].secondImage}
                            alt=""
                            className="w-28 h-28 rounded-full object-cover shadow-lg border-4 border-white absolute -bottom-4 -right-8"
                          />
                          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                            <Heart size={12} className="fill-white" /> Matched
                          </div>
                        </div>
                      </div>
                      {/* Quote */}
                      <div className="md:w-3/5 p-8 md:p-10">
                        <div className="text-purple-600 text-5xl font-serif leading-none mb-4">"</div>
                        <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                          {testimonials[activeTestimonial].quote}
                        </p>
                        <div className="border-t border-gray-100 pt-4">
                          <p className="font-bold text-gray-900 text-lg">
                            {testimonials[activeTestimonial].name}
                          </p>
                          <p className="text-sm text-purple-600 font-medium">
                            {testimonials[activeTestimonial].location}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {testimonials[activeTestimonial].detail}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTestimonial(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === activeTestimonial ? 'bg-purple-600 w-8' : 'bg-gray-300 w-2'
                  }`}
                />
              ))}
            </div>
            
            {/* CTA after testimonials */}
            <div className="text-center mt-10">
              <p className="text-gray-600 mb-4">Your story could be next...</p>
              <Button 
                onClick={handleGetStarted}
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-6 rounded-full shadow-xl"
              >
                Start Your Story — Free
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </div>
          </div>


        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 bg-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t('landing.howItWorks')}
            </h2>
            <p className="text-xl text-gray-600">Getting started is simple</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { 
                step: "1", 
                title: t('landing.steps.step1.title'), 
                desc: t('landing.steps.step1.desc'),
                icon: Users,
                image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6940c70dbf312aa4658a9066/e32885cab_o1ocuxst.png"
              },
              { 
                step: "2", 
                title: t('landing.steps.step2.title'), 
                desc: t('landing.steps.step2.desc'),
                icon: Sparkles,
                image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6940c70dbf312aa4658a9066/65fc6c0a5_medium-shot-beautiful-african-woman-posing.jpg"
              },
              { 
                step: "3", 
                title: t('landing.steps.step3.title'), 
                desc: t('landing.steps.step3.desc'),
                icon: MessageCircle,
                image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6940c70dbf312aa4658a9066/61126ff23_premium_photo-1661281273104-150484122d32.jpg"
              },
              { 
                step: "4", 
                title: t('landing.steps.step4.title'), 
                desc: t('landing.steps.step4.desc'),
                icon: Heart,
                image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6940c70dbf312aa4658a9066/e32885cab_o1ocuxst.png"
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-xl transition-shadow">
                  <CardContent className="p-0">
                    <div className="relative">
                      <img 
                        src={idx === 0 ? "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6940c70dbf312aa4658a9066/fb4e02dea_ChatGPTImageFeb4202612_35_48PM.png" : item.image} 
                        alt={item.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <div className="absolute -bottom-6 left-6 w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-amber-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                        {item.step}
                      </div>
                    </div>
                    <div className="p-6 pt-10">
                      <div className="w-10 h-10 mb-3 rounded-full bg-purple-100 flex items-center justify-center">
                        <item.icon size={20} className="text-purple-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-gray-600 text-sm">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Preview */}
      <section className="relative z-10 bg-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-2 rounded-full mb-6">
            <Crown size={20} />
            <span className="font-semibold">{t('landing.premium.subtitle')}</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            {t('landing.premium.title')}
          </h2>
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              "Unlimited Likes",
              "See Who Likes You",
              "Advanced Filters",
              "Read Receipts",
              "Rewind Last Swipe",
              "Profile Boosts"
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center justify-center gap-2 text-gray-700">
                <CheckCircle size={20} className="text-green-600" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          </div>
          </section>

      {/* Final CTA Section - Strong Close */}
      <section className="relative z-10 bg-gradient-to-r from-purple-900 to-amber-900 py-20">
        <AfricanPattern className="text-white" opacity={0.05} />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {/* Emotional Hook */}
            <p className="text-amber-300 text-lg mb-4 font-medium">
              Somewhere out there, someone is waiting to meet you
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Don't Let Another Day Pass
            </h2>
            <p className="text-xl text-white/90 mb-4 max-w-2xl mx-auto">
              Every hour you wait is an hour you could be connecting with someone who shares your culture, values, and dreams for the future.
            </p>
            
            {/* Scarcity/Urgency */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-lg px-6 py-3 rounded-full mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-white/90 text-sm">{liveCount} singles online now in your area</span>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <Button 
                onClick={handleGetStarted}
                size="lg" 
                className="bg-white text-purple-900 hover:bg-gray-100 px-12 py-7 text-xl rounded-full shadow-2xl transform hover:scale-105 transition-all font-bold"
              >
                Find Your Person — Free
                <ArrowRight size={24} className="ml-2" />
              </Button>
              <div className="flex items-center gap-4 text-white/70 text-sm mt-2">
                <span>✓ 100% Free</span>
                <span>✓ 2 min signup</span>
                <span>✓ Cancel anytime</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mobile Sticky CTA - High Converting */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-3 md:hidden" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}>
        {isLoggedIn ? (
          <Link to={createPageUrl('Home')} className="block">
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-full py-6 text-base font-bold">
              Open Afrinnect
            </Button>
          </Link>
        ) : (
          <div className="space-y-2">
            <Button 
              onClick={handleGetStarted}
              className="w-full bg-gradient-to-r from-purple-600 to-amber-600 text-white rounded-full py-6 text-base font-bold shadow-lg"
            >
              Find Your Match — Free
              <ArrowRight size={18} className="ml-2" />
            </Button>
            <p className="text-center text-xs text-gray-500">
              Join {liveCount}+ people online now • Takes 2 minutes
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-900 text-white py-12 pb-32 md:pb-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Logo size="default" />
          <p className="text-gray-400 mt-4">
            {t('landing.footer.tagline')}
          </p>
          <div className="flex justify-center gap-6 mt-6 text-sm text-gray-400">
            <Link to={createPageUrl('Privacy')} className="hover:text-white" id="privacy-policy">Privacy Policy</Link>
            <Link to={createPageUrl('Terms')} className="hover:text-white">Terms of Service</Link>
            <Link to={createPageUrl('CommunityGuidelines')} className="hover:text-white">{t('landing.footer.guidelines')}</Link>
          </div>
          {/* Contact & Copyright */}
          <div className="mt-8 pt-8 border-t border-gray-800">
            <p className="text-sm text-gray-400 mb-2">
              Contact us: <a href="mailto:Support@afrinnect.com" className="text-amber-400 hover:text-amber-300">Support@afrinnect.com</a>
            </p>
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} Afrinnect. All rights reserved.</p>
            <p className="text-xs text-gray-500 mt-2">
              Afrinnect and the Afrinnect logo are trademarks of Afrinnect. Unauthorized use is prohibited.
            </p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}