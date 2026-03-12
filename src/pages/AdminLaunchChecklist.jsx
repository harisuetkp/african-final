import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Rocket, Mail, Shield, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Logo from '@/components/shared/Logo';

export default function AdminLaunchChecklist() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
           <Logo />
           <Link to={createPageUrl('AdminDashboard')}>
             <Button variant="outline" className="gap-2">
               <ArrowLeft size={16} /> Back to Dashboard
             </Button>
           </Link>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Rocket className="text-purple-600" />
            Afrinnect Launch Checklist
          </h1>
          <p className="text-gray-600">Follow these steps when you are ready to go live.</p>
        </div>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <span className="bg-amber-100 text-amber-800 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
              Remove Waitlist Restrictions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3">
              <AlertTriangle className="text-amber-600 shrink-0" />
              <div>
                <p className="text-amber-900 text-sm font-medium">Action Required:</p>
                <p className="text-amber-900 text-sm mt-1">
                  Tell the AI Agent: 
                  <code className="bg-white px-2 py-1 rounded border border-amber-300 block mt-2 font-mono text-xs sm:text-sm">
                    "Launch the app and remove waitlist restrictions."
                  </code>
                </p>
              </div>
            </div>
            <p className="text-gray-600 text-sm pl-11">
              This will automatically revert the Landing page buttons to the signup flow and remove the blockers in the onboarding process.
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <span className="bg-purple-100 text-purple-800 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
              Notify Waitlist Members
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4 pl-2">
              <div className="bg-purple-100 p-2 rounded-lg shrink-0">
                <Mail className="text-purple-600" size={24} />
              </div>
              <div className="space-y-2">
                <p className="font-medium">Send the Launch Email</p>
                <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2">
                  <li>Go to your <strong>Admin Dashboard</strong></li>
                  <li>Navigate to the <strong>Messaging</strong> tab</li>
                  <li>Find the <strong>Waitlist Invitations</strong> card</li>
                  <li>Click <strong>Draft Launch Email</strong></li>
                  <li>Review and click <strong>Send Emails</strong></li>
                </ol>
                <Link to={createPageUrl('AdminDashboard')}>
                  <Button size="sm" className="mt-2 bg-purple-600 hover:bg-purple-700">
                    Go to Messaging
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
              Post-Launch Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 pl-2">
              <div className="bg-white border p-4 rounded-lg text-center space-y-2 hover:shadow-md transition-shadow">
                <div className="mx-auto w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="text-blue-600" size={20} />
                </div>
                <h3 className="font-medium">User Growth</h3>
                <p className="text-xs text-gray-500">Watch the "Users" tab for new signups</p>
              </div>
              <div className="bg-white border p-4 rounded-lg text-center space-y-2 hover:shadow-md transition-shadow">
                <div className="mx-auto w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Shield className="text-green-600" size={20} />
                </div>
                <h3 className="font-medium">Safety</h3>
                <p className="text-xs text-gray-500">Monitor "Moderation" for reports</p>
              </div>
              <div className="bg-white border p-4 rounded-lg text-center space-y-2 hover:shadow-md transition-shadow">
                <div className="mx-auto w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="text-red-600" size={20} />
                </div>
                <h3 className="font-medium">Issues</h3>
                <p className="text-xs text-gray-500">Check "Error Logs" for any bugs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}