import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Send } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const GIFTS = [
  // Classics
  { type: 'rose', name: 'Rose', emoji: '🌹', price: 1.99 },
  { type: 'chocolate', name: 'Chocolate', emoji: '🍫', price: 2.99 },
  { type: 'coffee', name: 'Coffee', emoji: '☕', price: 2.99 },
  { type: 'cocktail', name: 'Cocktail', emoji: '🍸', price: 4.99 },
  { type: 'heart', name: 'Love', emoji: '❤️', price: 1.99 },
  { type: 'kiss', name: 'Kiss', emoji: '💋', price: 1.99 },
  
  // Luxury
  { type: 'diamond', name: 'Diamond', emoji: '💎', price: 9.99 },
  { type: 'ring', name: 'Ring', emoji: '💍', price: 14.99 },
  { type: 'crown', name: 'Crown', emoji: '👑', price: 4.99 },
  { type: 'champagne', name: 'Champagne', emoji: '🍾', price: 19.99 },
  { type: 'money_bag', name: 'Bag of Cash', emoji: '💰', price: 24.99 },
  { type: 'airplane', name: 'Trip', emoji: '✈️', price: 49.99 },
  { type: 'car', name: 'Sports Car', emoji: '🏎️', price: 29.99 },
  { type: 'house', name: 'Mansion', emoji: '🏰', price: 99.99 },
  
  // Fun & Cute
  { type: 'teddy', name: 'Teddy Bear', emoji: '🧸', price: 5.99 },
  { type: 'balloon', name: 'Balloon', emoji: '🎈', price: 1.99 },
  { type: 'party', name: 'Party', emoji: '🎉', price: 3.99 },
  { type: 'fire', name: 'Hot', emoji: '🔥', price: 0.99 },
  { type: 'star', name: 'Star', emoji: '⭐', price: 3.99 },
  { type: 'trophy', name: 'Champion', emoji: '🏆', price: 4.99 },

  // African Cultural
  { type: 'kente', name: 'Kente Cloth', emoji: '🧣', price: 9.99 },
  { type: 'drum', name: 'Djembe Drum', emoji: '🥁', price: 7.99 },
  { type: 'beads', name: 'Waist Beads', emoji: '📿', price: 5.99 },
  { type: 'kola', name: 'Kola Nuts', emoji: '🌰', price: 2.99 },
  { type: 'fan', name: 'Hand Fan', emoji: '🪭', price: 4.99 },
  { type: 'mask', name: 'Tribal Mask', emoji: '👺', price: 12.99 },
  { type: 'calabash', name: 'Calabash', emoji: '🏺', price: 3.99 },
  { type: 'shea', name: 'Shea Butter', emoji: '🧴', price: 4.99 },
  
  // Tech & Gadgets
  { type: 'phone', name: 'Smartphone', emoji: '📱', price: 19.99 },
  { type: 'laptop', name: 'Laptop', emoji: '💻', price: 29.99 },
  { type: 'camera', name: 'Camera', emoji: '📸', price: 14.99 },
  { type: 'headphones', name: 'Headphones', emoji: '🎧', price: 9.99 },
  { type: 'watch', name: 'Smart Watch', emoji: '⌚', price: 12.99 },

  // Food & Dining
  { type: 'pizza', name: 'Pizza', emoji: '🍕', price: 4.99 },
  { type: 'sushi', name: 'Sushi', emoji: '🍣', price: 6.99 },
  { type: 'burger', name: 'Burger', emoji: '🍔', price: 3.99 },
  { type: 'wine', name: 'Fine Wine', emoji: '🍷', price: 8.99 },
  { type: 'beer', name: 'Beer', emoji: '🍺', price: 2.99 },
  { type: 'cake', name: 'Cake', emoji: '🎂', price: 5.99 },
  
  // Nature & Flowers
  { type: 'bouquet', name: 'Bouquet', emoji: '💐', price: 6.99 },
  { type: 'sunflower', name: 'Sunflower', emoji: '🌻', price: 2.99 },
  { type: 'tulip', name: 'Tulip', emoji: '🌷', price: 2.99 },
  { type: 'hibiscus', name: 'Hibiscus', emoji: '🌺', price: 2.99 },
  { type: 'palm', name: 'Palm Tree', emoji: '🌴', price: 4.99 }
];

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'popular', label: 'Popular' },
  { id: 'luxury', label: 'Luxury' },
  { id: 'cultural', label: 'African' },
  { id: 'food', label: 'Food & Drink' },
  { id: 'tech', label: 'Tech' },
  { id: 'nature', label: 'Flowers' }
];

export default function VirtualGifts() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [myProfile, setMyProfile] = useState(null);
  const [selectedGift, setSelectedGift] = useState(null);
  const [message, setMessage] = useState('');
  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get('profileId');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (profiles.length > 0) {
          const profile = profiles[0];
          setMyProfile(profile);
        }
      } catch (e) {}
    };
    fetchProfile();
  }, []);

  const handleSendGift = () => {
    // Will be implemented via native in-app purchases (iOS/Android)
    console.log('Sending gift:', selectedGift, 'with message:', message);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-amber-50 pb-24">
      <header className="bg-white/80 backdrop-blur-lg border-b sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link to={createPageUrl(`Profile?id=${profileId}`)}>
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="font-bold text-lg">Send a Gift</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-purple-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {GIFTS.filter(gift => {
            if (activeCategory === 'all') return true;
            if (activeCategory === 'popular') return ['rose', 'chocolate', 'heart', 'kiss'].includes(gift.type);
            if (activeCategory === 'luxury') return ['diamond', 'ring', 'crown', 'champagne', 'money_bag', 'car', 'house', 'airplane'].includes(gift.type);
            if (activeCategory === 'cultural') return ['kente', 'drum', 'beads', 'kola', 'fan', 'mask', 'calabash', 'shea'].includes(gift.type);
            if (activeCategory === 'food') return ['pizza', 'sushi', 'burger', 'wine', 'beer', 'cake', 'coffee', 'cocktail', 'chocolate'].includes(gift.type);
            if (activeCategory === 'tech') return ['phone', 'laptop', 'camera', 'headphones', 'watch'].includes(gift.type);
            if (activeCategory === 'nature') return ['bouquet', 'sunflower', 'tulip', 'hibiscus', 'palm', 'rose'].includes(gift.type);
            return true;
          }).map(gift => (
            <motion.div
              key={gift.type}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card
                className={`cursor-pointer transition-all ${
                  selectedGift?.type === gift.type
                    ? 'ring-2 ring-purple-600 shadow-lg border-purple-200'
                    : 'hover:shadow-md border-transparent'
                }`}
                onClick={() => setSelectedGift(gift)}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-5xl mb-2 filter drop-shadow-sm">{gift.emoji}</div>
                  <p className="font-semibold text-sm truncate">{gift.name}</p>
                  <p className="text-xs text-purple-600 font-bold">${gift.price}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {selectedGift && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card>
              <CardContent className="p-4">
                <Label htmlFor="message">Add a message (optional)</Label>
                <Input
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Say something sweet..."
                  className="mt-2"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {message.length}/100
                </p>
              </CardContent>
            </Card>

            <Button
              onClick={handleSendGift}
              className="w-full py-6 text-lg bg-gradient-to-r from-pink-600 to-purple-600"
            >
              <Send size={20} className="mr-2" />
              Send {selectedGift.emoji} for ${selectedGift.price}
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
}