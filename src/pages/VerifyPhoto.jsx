import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import {
  Camera, CheckCircle, Shield, Loader2, AlertCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function VerifyPhoto() {
  const [myProfile, setMyProfile] = useState(null);
  const [step, setStep] = useState('intro'); // intro, center, left, right, verifying, success, failed
  const [captures, setCaptures] = useState({ center: null, left: null, right: null });
  const [verificationResult, setVerificationResult] = useState(null);
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
          if (profiles.length > 0) {
            setMyProfile(profiles[0]);
          }
        }
      } catch (e) {
        console.log('Not logged in');
      }
    };
    fetchProfile();
  }, []);

  // Camera handling
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 640 } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Camera access denied. Please enable camera permissions to verify.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (['center', 'left', 'right'].includes(step)) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [step]);

  const captureFrame = async (pose) => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Flip horizontally for user experience (mirror) -> Capture mirrored? 
    // Usually better to capture raw, but users expect mirror. 
    // Let's draw it normally for analysis.
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      
      // Temporary placeholder while uploading
      const tempUrl = URL.createObjectURL(blob);
      setCaptures(prev => ({ ...prev, [pose]: tempUrl }));

      // Upload immediately
      try {
        // Convert blob to file
        const file = new File([blob], `verification_${pose}.jpg`, { type: 'image/jpeg' });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        
        setCaptures(prev => ({ ...prev, [pose]: file_url }));
        
        // Advance step
        if (pose === 'center') setStep('left');
        else if (pose === 'left') setStep('right');
        else if (pose === 'right') verifyMutation.mutate({ 
            center: captures.center, 
            left: captures.left, 
            right: file_url 
        });

      } catch (error) {
        console.error('Upload failed:', error);
        alert('Failed to upload frame. Please try again.');
      }
    }, 'image/jpeg', 0.8);
  };

  const verifyMutation = useMutation({
    mutationFn: async (finalCaptures) => {
      setStep('verifying');
      
      // Ensure we have all URLs (passed from captureFrame or state)
      const centerUrl = captures.center || finalCaptures.center;
      const leftUrl = captures.left || finalCaptures.left;
      const rightUrl = finalCaptures.right; // passed directly

      const result = await base44.functions.invoke('verifyVideoIdentity', {
        centerUrl,
        leftUrl,
        rightUrl
      });

      return result.data;
    },
    onSuccess: (data) => {
      setVerificationResult(data);
      if (data.verified) {
        setStep('success');
      } else {
        setStep('failed');
      }
    },
    onError: () => {
      setStep('failed');
    }
  });

  const resetVerification = () => {
    setCaptures({ center: null, left: null, right: null });
    setVerificationResult(null);
    setStep('intro');
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-xl">
            <CheckCircle size={48} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Identity Verified! ✓</h2>
          <p className="text-gray-500 mb-2">
            Your video verification was successful.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            Confidence: {verificationResult?.confidence}%
          </p>
          <Link to={createPageUrl('Home')}>
            <Button className="bg-purple-600 hover:bg-purple-700 w-full">
              Continue to Afrinnect
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header - No back button if verification is mandatory */}
      <header className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-10" /> {/* Spacer - no back button during mandatory verification */}
          <h1 className="text-lg font-bold flex-1 text-center">Video Verification</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {step === 'intro' && (
          <Card className="mb-6">
            <CardContent className="p-6 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                <Camera size={40} className="text-purple-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">Let's verify it's really you</h2>
              <p className="text-gray-600 mb-6">
                We'll ask you to perform 3 simple head movements to confirm you're a real person.
              </p>
              
              <div className="space-y-4 mb-8 text-left max-w-xs mx-auto">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold">1</div>
                  <p>Center your face</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold">2</div>
                  <p>Turn head Left</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold">3</div>
                  <p>Turn head Right</p>
                </div>
              </div>

              <Button onClick={() => setStep('center')} className="w-full py-6 text-lg bg-purple-600 hover:bg-purple-700">
                Start Verification
              </Button>
            </CardContent>
          </Card>
        )}

        {['center', 'left', 'right'].includes(step) && (
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4 text-center">
              {step === 'center' && "Look Straight Ahead"}
              {step === 'left' && "Turn Head Left ←"}
              {step === 'right' && "Turn Head Right →"}
            </h2>

            <div className="relative w-64 h-80 bg-black rounded-3xl overflow-hidden shadow-xl mb-8 border-4 border-purple-600">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover transform -scale-x-100" // Mirror effect
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Overlay Guide */}
              <div className="absolute inset-0 border-2 border-white/50 rounded-full m-8 pointer-events-none" />
            </div>

            <Button 
              onClick={() => captureFrame(step)}
              className="w-full max-w-xs py-6 text-lg bg-purple-600 hover:bg-purple-700"
            >
              <Camera className="mr-2" />
              Capture & Continue
            </Button>
          </div>
        )}

        {step === 'verifying' && (
          <div className="text-center py-12">
            <Loader2 size={64} className="text-purple-600 animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-bold mb-2">Verifying Identity...</h2>
            <p className="text-gray-500">Analyzing your movements and face match.</p>
          </div>
        )}

        {step === 'failed' && (
          <div className="space-y-6">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong className="text-lg block mb-2">Verification Failed</strong>
                <p className="mb-4">
                  {verificationResult?.reason || "We couldn't verify your identity. Please make sure your face is clearly visible and you follow the movement instructions."}
                </p>
              </AlertDescription>
            </Alert>

            {/* Show captured photos with option to remove */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Captured Photos</h3>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {['center', 'left', 'right'].map(pose => (
                    <div key={pose} className="relative">
                      {captures[pose] ? (
                        <img 
                          src={captures[pose]} 
                          alt={pose} 
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                          <Camera size={20} className="text-gray-400" />
                        </div>
                      )}
                      <p className="text-xs text-center mt-1 capitalize text-gray-500">{pose}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  If these photos don't match your profile picture, you may need to update your profile photo first, then try verification again.
                </p>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button
                onClick={resetVerification}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Camera className="mr-2" size={18} />
                Retake Photos
              </Button>
              <Link to={createPageUrl('EditProfile')} className="block">
                <Button
                  variant="outline"
                  className="w-full"
                >
                  Update Profile Photo First
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}