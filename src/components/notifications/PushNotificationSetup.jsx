import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { app } from '@/components/firebase/firebaseConfig';

export default function PushNotificationSetup({ userProfile }) {
  const [isSetup, setIsSetup] = useState(false);

  const setupPushNotifications = useCallback(async () => {
    if (!userProfile || isSetup) return;

    try {
      // Check if messaging is supported
      const supported = await isSupported();
      if (!supported) {
        console.log('Firebase Messaging not supported in this browser');
        return;
      }

      // Check if service worker is supported
      if (!('serviceWorker' in navigator)) {
        console.log('Service workers not supported');
        return;
      }

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return;
      }

      // Get VAPID key from backend
      let vapidKey;
      try {
        const { data } = await base44.functions.invoke('getVapidKey');
        vapidKey = data?.vapid_key;
        if (!vapidKey) {
          console.warn('VAPID key not configured');
          return;
        }
      } catch (e) {
        console.warn('Failed to get VAPID key:', e);
        return;
      }

      // Get messaging instance
      let messaging;
      try {
        messaging = getMessaging(app);
      } catch (e) {
        console.warn("Messaging not supported:", e);
        return;
      }

      // Register service worker for push notifications
      let swRegistration;
      try {
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        await navigator.serviceWorker.ready;
      } catch (e) {
        console.warn('Service worker registration failed:', e);
        // Continue without service worker - FCM might still work
      }

      // Get FCM token
      try {
        const token = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: swRegistration
        });

        if (token) {
          // Only save if different from current token
          if (userProfile.push_token !== token) {
            try {
              await base44.functions.invoke('updateUserProfile', {
                push_token: token
              });
              console.log('Push token saved successfully');
            } catch (e) {
              console.warn('Failed to save push token:', e);
            }
          }
        }
      } catch (tokenError) {
        console.warn('Failed to get FCM token:', tokenError);
      }

      // Listen for foreground messages
      onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        
        // Show notification using Notification API
        if (Notification.permission === 'granted') {
          const notification = new Notification(
            payload.notification?.title || 'Afrinnect',
            {
              body: payload.notification?.body || '',
              icon: '/icon-192.png',
              badge: '/icon-72.png',
              tag: payload.data?.type || 'default',
              data: payload.data,
              requireInteraction: payload.data?.type === 'match' || payload.data?.type === 'super_like'
            }
          );

          notification.onclick = () => {
            window.focus();
            if (payload.data?.link) {
              window.location.href = payload.data.link;
            }
            notification.close();
          };
        }
      });

      setIsSetup(true);
    } catch (error) {
      console.error('Push notification setup failed:', error);
    }
  }, [userProfile, isSetup]);

  useEffect(() => {
    setupPushNotifications();
  }, [setupPushNotifications]);

  return null;
}