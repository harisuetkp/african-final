import React from 'react';
import { motion } from 'framer-motion';

export function ProfileCardSkeleton() {
  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
      <div className="relative h-[500px] bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
      <div className="p-6 space-y-3">
        <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}

export function ProfileGridSkeleton() {
  return (
    <div className="aspect-[3/4] rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
  );
}

export function MessageSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 animate-pulse">
      <div className="w-12 h-12 rounded-full bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-3 bg-gray-200 rounded w-3/4" />
      </div>
    </div>
  );
}

export function ChatLoadingSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
          <div className={`h-12 rounded-2xl bg-gray-200 animate-pulse ${i % 2 === 0 ? 'w-2/3' : 'w-1/2'}`} />
        </div>
      ))}
    </div>
  );
}

export default function LoadingSkeleton({ variant = 'card' }) {
  const skeletons = {
    card: ProfileCardSkeleton,
    grid: ProfileGridSkeleton,
    message: MessageSkeleton,
    chat: ChatLoadingSkeleton
  };
  
  const Skeleton = skeletons[variant] || ProfileCardSkeleton;
  return <Skeleton />;
}