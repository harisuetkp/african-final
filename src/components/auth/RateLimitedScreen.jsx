import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert, Clock, RefreshCw } from 'lucide-react';
import Logo from '@/components/shared/Logo';
import AfricanPattern from '@/components/shared/AfricanPattern';

export default function RateLimitedScreen({ retryAfter = 3600, onRetry }) {
  const [timeLeft, setTimeLeft] = useState(retryAfter);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 flex items-center justify-center p-4 relative">
      <AfricanPattern className="text-orange-600" opacity={0.05} />
      
      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <Logo size="large" />
        </div>

        <Card className="border-orange-300 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-orange-600 to-yellow-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <ShieldAlert size={32} />
              Too Many Attempts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <Alert className="bg-orange-50 border-orange-300">
              <Clock className="h-5 w-5 text-orange-600" />
              <AlertDescription className="text-orange-900 font-medium">
                You've made too many login attempts. Please wait before trying again.
              </AlertDescription>
            </Alert>

            <div className="text-center py-6">
              <div className="text-6xl font-bold text-orange-600 mb-2">
                {formatTime(timeLeft)}
              </div>
              <p className="text-gray-600">Time remaining</p>
            </div>

            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900">Why did this happen?</h3>
              <p className="text-sm text-gray-700">
                To protect your account and our community from unauthorized access, we limit login attempts. 
                This helps prevent automated attacks and keeps everyone safe.
              </p>
            </div>

            <div className="space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-gray-900">What you can do:</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Wait for the timer to reach zero</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Use the "Forgot Password" option if you can't remember your password</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Contact support if you believe this is an error</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button
                onClick={onRetry}
                disabled={timeLeft > 0}
                className="w-full gap-2"
              >
                <RefreshCw size={18} />
                {timeLeft > 0 ? `Try Again in ${formatTime(timeLeft)}` : 'Try Again Now'}
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/password-reset'}
                className="w-full"
              >
                Reset Password
              </Button>
            </div>

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Need help?{' '}
                <a href="mailto:support@afrinnect.com" className="text-blue-600 hover:underline font-medium">
                  Contact Support
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}