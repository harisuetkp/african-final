import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Loader2, Printer, Download, TrendingUp, Users, DollarSign, Activity, 
  Shield, CheckCircle, AlertTriangle, Server, Code, Globe, Heart, Database, Brain
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Logo from '@/components/shared/Logo';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function InvestorReport() {
  const [date] = useState(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const { data: reportData, isLoading, error } = useQuery({
    queryKey: ['investor-report-full'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getReportData', {});
      if (response.data?.error) throw new Error(response.data.error);
      return response.data;
    },
    staleTime: 300000
  });

  const { stats, aiContent } = reportData || {};

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    const element = document.getElementById('report-content');
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10; // margin top

      // Simple scaling to fit on one page if possible, or split (for now single page fit logic)
      // A full report might be multiple pages. jsPDF auto-paging with html2canvas is tricky.
      // For MVP, we'll just save the captured image into PDF.
      
      // Calculate height in PDF units
      const imgHeightPdf = (imgHeight * pdfWidth) / imgWidth;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeightPdf);
      pdf.save(`Afrinnect_Investor_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
      alert("Failed to generate PDF. Please try printing instead.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 text-purple-600 animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Generating Comprehensive Report...</h2>
        <p className="text-gray-500">Aggregating data and generating AI insights</p>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-red-500 text-center">Error loading report: {error.message}</div>;
  }

  // Chart Colors
  const COLORS = ['#7c3aed', '#db2777', '#f59e0b', '#10b981', '#3b82f6'];

  return (
    <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white font-sans">
      
      {/* Controls */}
      <div className="max-w-[210mm] mx-auto mb-8 flex justify-between items-center print:hidden">
        <Button variant="outline" onClick={() => window.close()}>Back to Dashboard</Button>
        <div className="flex gap-4">
          <Button onClick={handlePrint} variant="outline" className="gap-2">
            <Printer size={16} /> Print
          </Button>
          <Button onClick={handleDownloadPDF} disabled={isGeneratingPdf} className="bg-purple-600 hover:bg-purple-700 gap-2">
            {isGeneratingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Download PDF
          </Button>
        </div>
      </div>

      {/* Report Container (A4 Width) */}
      <div id="report-content" className="max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none p-12 rounded-xl text-gray-900 min-h-[297mm]">
        
        {/* 1. Header */}
        <header className="border-b-2 border-gray-100 pb-8 mb-10 flex justify-between items-end">
          <div>
            <Logo size="large" showText />
            <h1 className="text-4xl font-bold mt-4 text-gray-900">Investor Report</h1>
            <p className="text-gray-500 mt-2 font-medium">{stats.executive.period} • {date}</p>
          </div>
          <div className="text-right">
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-sm px-3 py-1 mb-2">
              {stats.executive.stage}
            </Badge>
            <div className="text-sm text-gray-500">Confidential</div>
          </div>
        </header>

        {/* 1. Executive Summary */}
        <section className="mb-10">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-l-4 border-purple-600 pl-3">Executive Summary</h2>
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 text-lg leading-relaxed text-gray-800">
            {aiContent.summary}
          </div>
          
          {/* Key Metrics Snapshot */}
          <div className="grid grid-cols-5 gap-4 mt-6">
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-700">{stats.executive.totalUsers.toLocaleString()}</div>
              <div className="text-xs text-purple-600 font-medium uppercase mt-1">Total Users</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-700">+{stats.executive.newUsers.toLocaleString()}</div>
              <div className="text-xs text-green-600 font-medium uppercase mt-1">New Users</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-700">{stats.executive.activeUsers.toLocaleString()}</div>
              <div className="text-xs text-blue-600 font-medium uppercase mt-1">Active (MAU)</div>
            </div>
            <div className="p-4 bg-pink-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-pink-700">+{stats.executive.growthRate}%</div>
              <div className="text-xs text-pink-600 font-medium uppercase mt-1">Growth Rate</div>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-amber-700">${stats.monetization.mrr.toLocaleString()}</div>
              <div className="text-xs text-amber-600 font-medium uppercase mt-1">MRR</div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-10 mb-10">
          
          {/* 2. User Growth */}
          <section>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-l-4 border-purple-600 pl-3">User Growth & Acquisition</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Daily Signups (Avg)</span>
                <span className="font-bold">{stats.growth.dailySignups}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Weekly Signups (Avg)</span>
                <span className="font-bold">{stats.growth.weeklySignups}</span>
              </div>
              
              <div className="mt-4">
                <h3 className="text-xs font-semibold text-gray-500 mb-2">Acquisition Sources</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.growth.sources} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
                      <Bar dataKey="value" fill="#7c3aed" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Demographics */}
          <section>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-l-4 border-purple-600 pl-3">Demographics</h2>
            <div className="flex gap-4 mb-6">
              <div className="w-1/2 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.demographics.gender} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={25} outerRadius={50}>
                      {stats.demographics.gender.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center text-xs text-gray-500 mt-1">Gender Distribution</div>
              </div>
              <div className="w-1/2 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.demographics.ageDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={25} outerRadius={50}>
                      {stats.demographics.ageDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center text-xs text-gray-500 mt-1">Age Groups</div>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-500 mb-2">Top Countries</h3>
              <div className="space-y-2">
                {stats.demographics.topCountries.map((c, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="flex items-center gap-2"><Globe size={12} className="text-gray-400" /> {c.name}</span>
                    <span className="font-medium">{c.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* 4. Engagement */}
        <section className="mb-10">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-l-4 border-purple-600 pl-3">Engagement Metrics</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="text-xs text-gray-500 uppercase mb-1">DAU / MAU</div>
              <div className="text-xl font-bold text-gray-900">{stats.engagement.dau} <span className="text-gray-400 text-sm">/ {stats.engagement.mau}</span></div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="text-xs text-gray-500 uppercase mb-1">Avg Session</div>
              <div className="text-xl font-bold text-gray-900">{stats.engagement.avgSessionDuration}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="text-xs text-gray-500 uppercase mb-1">Matches/User</div>
              <div className="text-xl font-bold text-gray-900">{stats.engagement.matchesPerUser}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="text-xs text-gray-500 uppercase mb-1">Profile Complete</div>
              <div className="text-xl font-bold text-gray-900">{stats.engagement.profileCompletionRate}%</div>
            </div>
          </div>
        </section>

        {/* 5. Trust & Safety */}
        <section className="mb-10 bg-red-50/50 p-6 rounded-xl border border-red-100">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-l-4 border-red-500 pl-3">Trust, Safety & Moderation</h2>
          <div className="grid grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Verified Profiles</span>
                <span className="font-bold text-green-600">{stats.trustSafety.verifiedUsers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Scams Blocked</span>
                <span className="font-bold text-red-600">{stats.trustSafety.scamAccounts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Banned Accounts</span>
                <span className="font-bold">{stats.trustSafety.bannedUsers}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Resolution</span>
                <span className="font-bold">{stats.trustSafety.avgResolutionTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Detection Rate</span>
                <span className="font-bold">{stats.trustSafety.scamDetectionRate}</span>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-500 mb-2">Systems Active</h3>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-white border-green-200 text-green-700">AI Scam Detection</Badge>
                <Badge className="bg-white border-green-200 text-green-700">Video Verification</Badge>
                <Badge className="bg-white border-green-200 text-green-700">Auto-Moderation</Badge>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-10 mb-10">
          
          {/* 6. Product Status */}
          <section>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-l-4 border-purple-600 pl-3">Product Development</h2>
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-green-600 uppercase mb-2">Live Features</div>
                <div className="flex flex-wrap gap-2">
                  {stats.product.live.map((f, i) => (
                    <Badge key={i} variant="outline" className="bg-green-50 text-green-700 border-green-200">{f}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-blue-600 uppercase mb-2">In Progress</div>
                <div className="flex flex-wrap gap-2">
                  {stats.product.inProgress.map((f, i) => (
                    <Badge key={i} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{f}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 7. Technical Health */}
          <section>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-l-4 border-purple-600 pl-3">System Health</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-center gap-3">
                <Server className="text-green-500" size={20} />
                <div>
                  <div className="text-xs text-gray-500">Uptime</div>
                  <div className="font-bold">{stats.tech.uptime}</div>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-center gap-3">
                <Activity className="text-blue-500" size={20} />
                <div>
                  <div className="text-xs text-gray-500">Avg Response</div>
                  <div className="font-bold">{stats.tech.avgResponseTime}</div>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-center gap-3">
                <Shield className="text-purple-500" size={20} />
                <div>
                  <div className="text-xs text-gray-500">Security</div>
                  <div className="font-bold text-green-600">{stats.tech.securityStatus}</div>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-center gap-3">
                <Database className="text-amber-500" size={20} />
                <div>
                  <div className="text-xs text-gray-500">Data Ownership</div>
                  <div className="font-bold text-gray-900">{stats.tech.dataOwnership}</div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* 8, 9, 10. Financials & Strategy */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <section className="bg-gray-50 p-5 rounded-xl border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="text-green-600" size={18} /> Monetization
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Status</span> <span className="font-medium">{stats.monetization.status}</span></div>
              <div className="flex justify-between"><span>MRR</span> <span className="font-bold text-green-700">${stats.monetization.mrr}</span></div>
              <div className="flex justify-between"><span>ARPU</span> <span className="font-medium">${stats.monetization.arpu}</span></div>
            </div>
          </section>

          <section className="bg-gray-50 p-5 rounded-xl border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="text-blue-600" size={18} /> Community
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Waitlist</span> <span className="font-medium">{stats.community.waitlist}</span></div>
              <div className="flex justify-between"><span>Social Reach</span> <span className="font-medium">{stats.community.socialFollowers}</span></div>
              <div className="flex justify-between"><span>Referrals</span> <span className="font-medium">{stats.community.referralRate}</span></div>
            </div>
          </section>

          <section className="bg-purple-50 p-5 rounded-xl border border-purple-200">
            <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
              <Brain className="text-purple-600" size={18} /> AI Strategy
            </h3>
            <div className="text-sm text-purple-900 space-y-2">
              <p><strong>Focus:</strong> {aiContent.nextFocus}</p>
              <p><strong>Risk:</strong> {aiContent.risks}</p>
            </div>
          </section>
        </div>

        {/* AI Insights List */}
        <section className="bg-amber-50/50 p-6 rounded-xl border border-amber-100 mb-8">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-l-4 border-amber-500 pl-3">Key Strategic Insights</h2>
          <ul className="space-y-3">
            {aiContent.insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-800">
                <CheckCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                {insight}
              </li>
            ))}
          </ul>
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-gray-400 mt-12 pt-8 border-t border-gray-100">
          <p>Generated automatically by Afrinnect Admin Dashboard • {new Date().getFullYear()} Afrinnect Inc.</p>
          <p className="mt-1">Confidential & Proprietary Information</p>
        </footer>

      </div>
    </div>
  );
}