import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cookie, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShowBanner(false);
  };

  const declineCookies = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-20 md:pb-4">
      <Card className="max-w-4xl mx-auto bg-white shadow-2xl border-2">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Cookie size={24} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2">Cookie Notice</h3>
              <p className="text-gray-600 text-sm mb-4">
                We use cookies and similar technologies to enhance your experience, analyze site traffic, 
                and personalize content. By clicking "Accept All", you consent to our use of cookies. 
                You can manage your preferences at any time in your settings.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={acceptCookies}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Accept All Cookies
                </Button>
                <Button 
                  onClick={declineCookies}
                  variant="outline"
                >
                  Decline Optional
                </Button>
                <Link to={createPageUrl('Privacy')}>
                  <Button variant="ghost" className="text-sm">
                    Privacy Policy
                  </Button>
                </Link>
              </div>
            </div>
            <button 
              onClick={declineCookies}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}