import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from 'lucide-react';
import Logo from '@/components/shared/Logo';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-amber-900 flex items-center justify-center p-4">
      <div className="text-center">
        <Logo size="large" />
        <div className="mt-8 mb-6">
          <h1 className="text-9xl font-bold text-white mb-4">404</h1>
          <h2 className="text-3xl font-bold text-white mb-2">Page Not Found</h2>
          <p className="text-white/80 text-lg mb-8">
            Oops! The page you're looking for doesn't exist.
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="bg-white/20 text-white border-white/30 hover:bg-white/30"
          >
            <ArrowLeft size={18} className="mr-2" />
            Go Back
          </Button>
          <Link to={createPageUrl('Home')}>
            <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
              <Home size={18} className="mr-2" />
              Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}