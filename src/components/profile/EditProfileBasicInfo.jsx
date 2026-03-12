import React from 'react';
import { Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function EditProfileBasicInfo({ formData, onChange }) {
  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-6">
        <div className="flex items-center gap-3 text-white">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
            <Heart size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">About You</h2>
            <p className="text-sm text-white/80">Tell us about yourself</p>
          </div>
        </div>
      </div>
      
      <CardContent className="p-6 space-y-5">
        <div>
          <Label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            Display Name
          </Label>
          <Input
            value={formData.display_name || ''}
            onChange={(e) => onChange({ ...formData, display_name: e.target.value })}
            placeholder="How should we call you?"
            className="border-2 focus:border-purple-400 rounded-xl"
          />
        </div>
        
        <div>
          <Label className="text-sm font-semibold text-gray-700 mb-2">Bio</Label>
          <Textarea
            value={formData.bio || ''}
            onChange={(e) => {
              if (e.target.value.length <= 500) {
                onChange({ ...formData, bio: e.target.value });
              }
            }}
            placeholder="Share something interesting about yourself..."
            rows={4}
            maxLength={500}
            className="border-2 focus:border-purple-400 rounded-xl resize-none"
          />
          <p className={`text-xs mt-1 ${(formData.bio?.length || 0) >= 450 ? 'text-amber-600' : 'text-gray-500'}`}>
            {formData.bio?.length || 0}/500 characters
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-2">Date of Birth</Label>
            <Input
              type="date"
              value={formData.birth_date || ''}
              onChange={(e) => onChange({ ...formData, birth_date: e.target.value })}
              className="border-2 focus:border-purple-400 rounded-xl"
            />
          </div>

          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-2">Gender</Label>
            <Select 
              value={formData.gender || ''} 
              onValueChange={(v) => onChange({ ...formData, gender: v })}
            >
              <SelectTrigger className="border-2 rounded-xl">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="man">Man</SelectItem>
                <SelectItem value="woman">Woman</SelectItem>
                <SelectItem value="non_binary">Non-binary</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-sm font-semibold text-gray-700 mb-2">Looking For</Label>
          <Select 
            value={formData.relationship_goal || ''} 
            onValueChange={(v) => onChange({ ...formData, relationship_goal: v })}
          >
            <SelectTrigger className="border-2 rounded-xl">
              <SelectValue placeholder="What are you looking for?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dating">Dating</SelectItem>
              <SelectItem value="serious_relationship">Serious Relationship</SelectItem>
              <SelectItem value="marriage">Marriage</SelectItem>
              <SelectItem value="friendship">Friendship</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}