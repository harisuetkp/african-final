import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';

export default function UbuntuAIButton() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="fixed bottom-24 right-6 z-40"
    >
      <Link to={createPageUrl('SupportChat')}>
        <Button
          size="lg"
          className="rounded-full w-14 h-14 shadow-2xl bg-gradient-to-br from-purple-600 to-amber-600 hover:from-purple-700 hover:to-amber-700"
          title="Chat with Ubuntu AI"
        >
          <Sparkles size={24} className="text-white" />
        </Button>
      </Link>
    </motion.div>
  );
}