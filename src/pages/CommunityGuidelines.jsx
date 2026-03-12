import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function CommunityGuidelines() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to={createPageUrl('Landing')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft size={24} />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">Community Guidelines</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Afrinnect Community Guidelines</h2>
            <p className="text-gray-700">Afrinnect is a safe, respectful community celebrating African culture and meaningful connections.</p>
          </div>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">✅ Do's - Be Respectful</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Treat everyone with kindness and respect</li>
              <li>Be honest in your profile and photos</li>
              <li>Celebrate cultural diversity and heritage</li>
              <li>Communicate clearly about your intentions</li>
              <li>Report suspicious or inappropriate behavior</li>
              <li>Respect boundaries and consent</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">❌ Don'ts - Zero Tolerance</h3>
            <ul className="list-disc pl-6 space-y-2 text-red-700 font-medium">
              <li>Harassment, bullying, or threatening behavior</li>
              <li>Hate speech, racism, or discrimination</li>
              <li>Sexual harassment or unsolicited explicit content</li>
              <li>Fake profiles or catfishing</li>
              <li>Scamming or requesting money</li>
              <li>Sharing others' private information</li>
              <li>Using the platform for prostitution or trafficking</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">🔒 Safety First</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Never share financial information</li>
              <li>Meet in public places for first dates</li>
              <li>Tell someone where you're going</li>
              <li>Use our safety check-in feature</li>
              <li>Trust your instincts - report concerns immediately</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">📸 Profile Guidelines</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Use recent, clear photos of yourself</li>
              <li>No nudity or sexually explicit content</li>
              <li>No children in photos (for their protection)</li>
              <li>No images of violence, weapons, or illegal activity</li>
              <li>Verify your photos for the blue check badge</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">💬 Messaging Etiquette</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Start with friendly, respectful messages</li>
              <li>Respect if someone doesn't respond</li>
              <li>No spam or copy-paste messages</li>
              <li>Keep conversations appropriate</li>
              <li>If someone asks you to stop, respect it</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">🎯 Cultural Respect</h3>
            <p className="text-gray-700">
              Afrinnect celebrates the African diaspora. Whether you're African, of African descent, or simply interested in the culture, show respect for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Different cultures, traditions, and languages</li>
              <li>Religious beliefs and practices</li>
              <li>Varied backgrounds and experiences</li>
              <li>Personal boundaries and preferences</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">⚖️ Enforcement</h3>
            <p className="text-gray-700">Violations result in:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>First offense:</strong> Warning</li>
              <li><strong>Second offense:</strong> Temporary suspension (7-30 days)</li>
              <li><strong>Serious violations:</strong> Immediate permanent ban</li>
              <li><strong>Illegal activity:</strong> Report to authorities</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">📢 Reporting</h3>
            <p className="text-gray-700">
              See something concerning? Report it immediately. All reports are reviewed within 24 hours. Your report is confidential.
            </p>
          </section>

          <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
            <p className="text-purple-900 font-medium">
              Together, we build a community rooted in the African philosophy of Ubuntu - "I am because we are." Let's create meaningful connections with respect, safety, and cultural pride.
            </p>
          </div>

          {/* Copyright Notice */}
          <div className="pt-6 border-t text-center">
            <p className="text-sm text-gray-600">© {new Date().getFullYear()} Afrinnect. All rights reserved.</p>
            <p className="text-xs text-gray-500 mt-1">
              These guidelines are proprietary to Afrinnect and protected by copyright.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}