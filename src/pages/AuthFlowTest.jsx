import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, Phone, Mail, Lock } from 'lucide-react';
import { validateEmail, validatePhone, checkRateLimit } from '@/components/auth/RateLimitGuard';

export default function AuthFlowTest() {
  const [testResults, setTestResults] = useState({});
  const [testing, setTesting] = useState(false);
  const [testPhone, setTestPhone] = useState('+15555555555');
  const [testOTP, setTestOTP] = useState('');
  const [receivedOTP, setReceivedOTP] = useState('');

  const runFullAuthTest = async () => {
    setTesting(true);
    const results = {};

    // Test 1: Authentication check
    console.log('Test 1: Checking authentication...');
    try {
      const isAuth = await base44.auth.isAuthenticated();
      results.authCheck = { pass: true, message: `Authenticated: ${isAuth}` };
    } catch (e) {
      results.authCheck = { pass: false, message: e.message };
    }

    // Test 2: Get current user
    console.log('Test 2: Getting current user...');
    try {
      const user = await base44.auth.me();
      results.getUser = { pass: !!user, message: user ? `User: ${user.email}` : 'No user' };
    } catch (e) {
      results.getUser = { pass: false, message: e.message };
    }

    // Test 3: Legal acceptance check
    console.log('Test 3: Checking legal acceptance...');
    try {
      const user = await base44.auth.me();
      if (user) {
        const acceptances = await base44.entities.LegalAcceptance.filter({ user_id: user.id });
        results.legalCheck = { pass: true, message: `Acceptances: ${acceptances.length}` };
      }
    } catch (e) {
      results.legalCheck = { pass: false, message: e.message };
    }

    // Test 4: Profile check
    console.log('Test 4: Checking profile...');
    try {
      const user = await base44.auth.me();
      if (user) {
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        results.profileCheck = { pass: true, message: `Profiles: ${profiles.length}` };
      }
    } catch (e) {
      results.profileCheck = { pass: false, message: e.message };
    }

    // Test 5: Rate limiting - Login
    console.log('Test 5: Testing login rate limit...');
    try {
      const check = await checkRateLimit('login', 'test@example.com');
      results.loginRateLimit = { pass: check.allowed, message: check.allowed ? 'Rate limit OK' : check.error };
    } catch (e) {
      results.loginRateLimit = { pass: false, message: e.message };
    }

    // Test 6: Rate limiting - Signup
    console.log('Test 6: Testing signup rate limit...');
    try {
      const check = await checkRateLimit('signup', '192.168.1.1');
      results.signupRateLimit = { pass: check.allowed, message: check.allowed ? 'Rate limit OK' : check.error };
    } catch (e) {
      results.signupRateLimit = { pass: false, message: e.message };
    }

    // Test 7: Send OTP
    console.log('Test 7: Sending OTP...');
    try {
      const response = await base44.functions.invoke('sendOTP', { phone_number: testPhone });
      if (response.data.success) {
        setReceivedOTP(response.data.otp_code);
        results.sendOTP = { pass: true, message: `OTP: ${response.data.otp_code}` };
      }
    } catch (e) {
      results.sendOTP = { pass: false, message: e.response?.data?.error || e.message };
    }

    // Test 8: Password reset function
    console.log('Test 8: Checking password reset...');
    try {
      results.passwordReset = { 
        pass: typeof base44.auth.resetPassword === 'function', 
        message: 'Password reset available' 
      };
    } catch (e) {
      results.passwordReset = { pass: false, message: e.message };
    }

    // Test 9: Logout function
    console.log('Test 9: Checking logout...');
    try {
      results.logout = { 
        pass: typeof base44.auth.logout === 'function', 
        message: 'Logout function available' 
      };
    } catch (e) {
      results.logout = { pass: false, message: e.message };
    }

    setTestResults(results);
    setTesting(false);
  };

  const testOTPVerification = async () => {
    if (!testOTP || testOTP.length !== 6) {
      alert('Please enter 6-digit OTP');
      return;
    }

    try {
      const response = await base44.functions.invoke('verifyOTP', {
        phone_number: testPhone,
        otp_code: testOTP
      });
      
      if (response.data.success) {
        alert('✅ OTP Verified Successfully!');
        setTestResults(prev => ({
          ...prev,
          verifyOTP: { pass: true, message: 'OTP verification successful' }
        }));
      }
    } catch (e) {
      alert('❌ Verification failed: ' + (e.response?.data?.error || e.message));
      setTestResults(prev => ({
        ...prev,
        verifyOTP: { pass: false, message: e.response?.data?.error || e.message }
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🔐 Complete Auth Flow Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Run All Tests */}
            <Button 
              onClick={runFullAuthTest} 
              disabled={testing}
              className="w-full bg-purple-600 hover:bg-purple-700"
              size="lg"
            >
              {testing ? (
                <>
                  <Loader2 className="animate-spin mr-2" />
                  Running Tests...
                </>
              ) : (
                'Run Full Auth Test Suite'
              )}
            </Button>

            {/* Test Results */}
            {Object.keys(testResults).length > 0 && (
              <div className="space-y-2">
                {Object.entries(testResults).map(([name, result]) => (
                  <div key={name} className="flex items-center justify-between p-4 bg-white border rounded-lg">
                    <div className="flex items-center gap-3">
                      {result.pass ? (
                        <CheckCircle size={20} className="text-green-600" />
                      ) : (
                        <XCircle size={20} className="text-red-600" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{name}</p>
                        <p className="text-xs text-gray-500">{result.message}</p>
                      </div>
                    </div>
                    <Badge variant={result.pass ? 'default' : 'destructive'}>
                      {result.pass ? 'PASS' : 'FAIL'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* OTP Testing Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone size={20} />
              Test OTP Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {receivedOTP && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800">
                  OTP Generated: <span className="text-2xl font-bold">{receivedOTP}</span>
                </p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Test Phone Number</label>
              <Input
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+15555555555"
              />
            </div>

            {receivedOTP && (
              <div>
                <label className="text-sm font-medium">Enter OTP to Verify</label>
                <Input
                  value={testOTP}
                  onChange={(e) => setTestOTP(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                />
              </div>
            )}

            <Button
              onClick={testOTPVerification}
              disabled={!receivedOTP || testOTP.length !== 6}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Test Verify OTP
            </Button>
          </CardContent>
        </Card>

        {/* Summary */}
        {Object.keys(testResults).length > 0 && (
          <Card className="border-2 border-purple-200">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Test Summary</h3>
                <div className="flex items-center justify-center gap-8 text-lg">
                  <div className="text-green-600 font-bold">
                    ✓ {Object.values(testResults).filter(r => r.pass).length} Passed
                  </div>
                  <div className="text-red-600 font-bold">
                    ✗ {Object.values(testResults).filter(r => !r.pass).length} Failed
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}