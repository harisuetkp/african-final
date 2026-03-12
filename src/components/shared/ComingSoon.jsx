import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Rocket, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import AfricanPattern from '@/components/shared/AfricanPattern';

export default function ComingSoon({ title = "Coming Soon", description = "We're working hard to bring this feature to you. Stay tuned!", icon: Icon = Rocket }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-amber-50 relative flex flex-col">
      <AfricanPattern className="text-purple-600" opacity={0.03} />
      
      <header className="p-4">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" size="icon">
            <ArrowLeft size={24} />
          </Button>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-amber-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <Icon size={48} className="text-purple-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{title}</h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          {description}
        </p>

        <div className="flex gap-2 text-sm text-purple-600 font-medium bg-purple-50 px-4 py-2 rounded-full">
          <Sparkles size={16} />
          <span>Launch Expected Soon</span>
        </div>
      </main>
    </div>
  );
}