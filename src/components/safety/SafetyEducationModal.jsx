import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, CheckCircle, Heart, Camera, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SafetyEducationModal({ open, onClose, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: Shield,
      title: "Welcome to Afrinnect Safety",
      description: "Your safety is our top priority. Let's walk you through our safety features.",
      color: "blue",
      features: [
        "AI-powered content moderation",
        "24/7 safety monitoring",
        "Verification badges for trust"
      ]
    },
    {
      icon: Camera,
      title: "Photo Verification",
      description: "Get verified to show you're real and increase matches by 3x.",
      color: "green",
      features: [
        "Upload a selfie matching your profile",
        "AI instantly verifies in seconds",
        "Get a verified badge on your profile"
      ]
    },
    {
      icon: AlertTriangle,
      title: "Safety Check-Ins",
      description: "Meeting someone new? Set up a safety check-in for peace of mind.",
      color: "amber",
      features: [
        "Share meeting details with emergency contact",
        "Get reminder to check in after date",
        "Emergency contact notified if you don't respond"
      ]
    },
    {
      icon: Bell,
      title: "Report & Block",
      description: "If someone makes you uncomfortable, take action immediately.",
      color: "red",
      features: [
        "Report inappropriate behavior instantly",
        "Block users from contacting you",
        "Our team reviews ALL reports within 24 hours",
        "You'll get notified once we take action",
        "Reported users never know who reported them",
        "Serious violations = immediate account suspension"
      ]
    },
    {
      icon: Heart,
      title: "Respectful Community",
      description: "Everyone deserves respect. Help us maintain a safe space.",
      color: "purple",
      features: [
        "Treat others how you want to be treated",
        "No harassment, threats, or hate speech",
        "Violations result in account suspension"
      ]
    }
  ];

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete?.();
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center">Safety Guide</DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 py-6"
          >
            {/* Icon */}
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
              currentStepData.color === 'blue' ? 'bg-blue-100' :
              currentStepData.color === 'green' ? 'bg-green-100' :
              currentStepData.color === 'amber' ? 'bg-amber-100' :
              currentStepData.color === 'red' ? 'bg-red-100' :
              'bg-purple-100'
            }`}>
              <Icon size={40} className={
                currentStepData.color === 'blue' ? 'text-blue-600' :
                currentStepData.color === 'green' ? 'text-green-600' :
                currentStepData.color === 'amber' ? 'text-amber-600' :
                currentStepData.color === 'red' ? 'text-red-600' :
                'text-purple-600'
              } />
            </div>

            {/* Content */}
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold">{currentStepData.title}</h3>
              <p className="text-gray-600">{currentStepData.description}</p>
            </div>

            {/* Features */}
            <div className="space-y-3">
              {currentStepData.features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{feature}</p>
                </motion.div>
              ))}
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center gap-2">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentStep ? 'bg-purple-600 w-8' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleSkip} className="flex-1">
            Skip for Now
          </Button>
          <Button onClick={handleNext} className="flex-1 bg-purple-600 hover:bg-purple-700">
            {currentStep < steps.length - 1 ? 'Next' : 'Get Started'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}