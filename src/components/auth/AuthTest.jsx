import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Loader2 } from 'lucide-react';

export default function AuthTest() {
  const [results, setResults] = useState({});
  const [testing, setTesting] = useState(false);

  const runTests = async () => {
    setTesting(true);
    const testResults = {};

    // Test 1: Check if authenticated
    try {
      const isAuth = await base44.auth.isAuthenticated();
      testResults.isAuthenticated = { pass: isAuth, message: isAuth ? 'User is authenticated' : 'User not authenticated' };
    } catch (e) {
      testResults.isAuthenticated = { pass: false, message: e.message };
    }

    // Test 2: Get current user
    try {
      const user = await base44.auth.me();
      testResults.getCurrentUser = { pass: !!user, message: user ? `User: ${user.email}` : 'No user found' };
    } catch (e) {
      testResults.getCurrentUser = { pass: false, message: e.message };
    }

    // Test 3: Check profile exists
    try {
      const user = await base44.auth.me();
      if (user) {
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        testResults.profileExists = { pass: profiles.length > 0, message: profiles.length > 0 ? 'Profile found' : 'No profile' };
      }
    } catch (e) {
      testResults.profileExists = { pass: false, message: e.message };
    }

    // Test 4: Check legal acceptance
    try {
      const user = await base44.auth.me();
      if (user) {
        const acceptances = await base44.entities.LegalAcceptance.filter({ user_id: user.id });
        testResults.legalAcceptance = { pass: acceptances.length > 0, message: acceptances.length > 0 ? 'Legal terms accepted' : 'No acceptance' };
      }
    } catch (e) {
      testResults.legalAcceptance = { pass: false, message: e.message };
    }

    // Test 5: Test logout function exists
    try {
      testResults.logoutFunction = { pass: typeof base44.auth.logout === 'function', message: 'Logout function available' };
    } catch (e) {
      testResults.logoutFunction = { pass: false, message: e.message };
    }

    // Test 6: Test OTP backend
    try {
      const otpTest = await base44.functions.invoke('sendOTP', { phone_number: '+15555555555' }).catch(e => ({ error: e.message }));
      testResults.otpBackend = { 
        pass: !otpTest.error, 
        message: otpTest.error || 'OTP backend working' 
      };
    } catch (e) {
      testResults.otpBackend = { pass: false, message: e.message };
    }

    // Test 7: Test rate limiting
    try {
      const rateLimitTest = await base44.functions.invoke('rateLimitAuth', { 
        action: 'login', 
        identifier: 'test@test.com' 
      }).catch(e => ({ error: e.message }));
      testResults.rateLimit = { 
        pass: !rateLimitTest.error, 
        message: rateLimitTest.error || 'Rate limiting working' 
      };
    } catch (e) {
      testResults.rateLimit = { pass: false, message: e.message };
    }

    // Test 8: Test password reset
    try {
      testResults.passwordReset = { 
        pass: typeof base44.auth.resetPassword === 'function', 
        message: 'Password reset function available' 
      };
    } catch (e) {
      testResults.passwordReset = { pass: false, message: e.message };
    }

    setResults(testResults);
    setTesting(false);
  };

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>🔐 Auth System Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runTests} disabled={testing} className="w-full">
          {testing ? (
            <>
              <Loader2 className="animate-spin mr-2" size={18} />
              Running Tests...
            </>
          ) : (
            'Run Authentication Tests'
          )}
        </Button>

        {Object.keys(results).length > 0 && (
          <div className="space-y-2 mt-4">
            {Object.entries(results).map(([test, result]) => (
              <div key={test} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{test}</p>
                  <p className="text-xs text-gray-500">{result.message}</p>
                </div>
                <Badge variant={result.pass ? 'default' : 'destructive'}>
                  {result.pass ? <Check size={14} /> : <X size={14} />}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}