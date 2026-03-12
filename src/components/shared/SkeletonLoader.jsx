import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function ProfileCardSkeleton() {
  return (
    <Card className="max-w-sm mx-auto overflow-hidden">
      <div className="aspect-[3/4] bg-gray-200 animate-pulse" />
      <CardContent className="p-4 space-y-3">
        <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-5/6" />
        </div>
      </CardContent>
    </Card>
  );
}

export function EventCardSkeleton() {
  return (
    <Card>
      <div className="h-48 bg-gray-200 animate-pulse" />
      <CardHeader>
        <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="h-3 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-4/5" />
      </CardContent>
    </Card>
  );
}

export function ListItemSkeleton({ count = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="flex items-center gap-3 p-4 bg-white rounded-lg border animate-pulse">
          <div className="w-12 h-12 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[0, 1, 0, 1, 0].map((align, idx) => (
        <div key={idx} className={`flex ${align ? 'justify-end' : 'justify-start'}`}>
          <div className="space-y-2">
            <div className={`h-12 ${align ? 'bg-purple-200' : 'bg-gray-200'} rounded-2xl animate-pulse w-48`} />
          </div>
        </div>
      ))}
    </div>
  );
}