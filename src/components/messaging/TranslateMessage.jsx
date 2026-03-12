import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Languages, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'sw', name: 'Swahili' },
  { code: 'ar', name: 'Arabic' },
  { code: 'yo', name: 'Yoruba' },
  { code: 'ha', name: 'Hausa' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'es', name: 'Spanish' }
];

export default function TranslateMessage({ message, messageId }) {
  const [translatedText, setTranslatedText] = useState(null);
  const [targetLang, setTargetLang] = useState('en');

  const translateMutation = useMutation({
    mutationFn: async (lang) => {
      // Use AI to translate
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Translate this message to ${LANGUAGES.find(l => l.code === lang)?.name}: "${message}"
        
        Provide ONLY the translation, nothing else.`,
        response_json_schema: {
          type: 'object',
          properties: {
            translation: { type: 'string' }
          }
        }
      });

      // Save translation
      const translations = await base44.entities.MessageTranslation.filter({ message_id: messageId });
      if (translations.length > 0) {
        const existing = translations[0];
        await base44.entities.MessageTranslation.update(existing.id, {
          translated_text: {
            ...existing.translated_text,
            [lang]: result.translation
          }
        });
      } else {
        await base44.entities.MessageTranslation.create({
          message_id: messageId,
          original_language: 'auto',
          translated_text: { [lang]: result.translation }
        });
      }

      return result.translation;
    },
    onSuccess: (data) => {
      setTranslatedText(data);
    }
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Languages size={14} className="text-gray-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-2">
          <p className="text-sm font-medium">Translate to:</p>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map(lang => (
              <Button
                key={lang.code}
                variant="outline"
                size="sm"
                onClick={() => {
                  setTargetLang(lang.code);
                  translateMutation.mutate(lang.code);
                }}
                disabled={translateMutation.isPending}
                className="text-xs"
              >
                {lang.name}
              </Button>
            ))}
          </div>
          
          {translateMutation.isPending && (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={20} className="animate-spin text-purple-600" />
            </div>
          )}
          
          {translatedText && (
            <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-xs text-purple-600 font-medium mb-1">
                {LANGUAGES.find(l => l.code === targetLang)?.name}:
              </p>
              <p className="text-sm text-gray-700">{translatedText}</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}