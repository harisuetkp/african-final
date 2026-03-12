import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ScreenshotAlertNotif({ myProfileId }) {
  const [dismissed, setDismissed] = useState([]);
  const queryClient = useQueryClient();

  const { data: screenshotAlerts = [] } = useQuery({
    queryKey: ['screenshot-alerts', myProfileId],
    queryFn: async () => {
      const alerts = await base44.entities.ScreenshotAlert.filter({
        screenshot_of_profile_id: myProfileId,
        alert_sent: false
      }, '-created_date', 10);

      // Mark as sent
      for (const alert of alerts) {
        await base44.entities.ScreenshotAlert.update(alert.id, {
          alert_sent: true
        });
      }

      return alerts;
    },
    enabled: !!myProfileId,
    refetchInterval: 10000 // Check every 10 seconds
  });

  const visibleAlerts = screenshotAlerts.filter(a => !dismissed.includes(a.id));

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {visibleAlerts.map(alert => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
          >
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 rounded-full">
                    <Camera size={20} className="text-red-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-red-900 flex items-center gap-2">
                          <AlertTriangle size={16} />
                          Screenshot Detected
                        </h4>
                        <p className="text-sm text-red-700 mt-1">
                          Someone may have taken a screenshot of your {alert.screenshot_location}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setDismissed([...dismissed, alert.id])}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}