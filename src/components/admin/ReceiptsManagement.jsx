import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receipt, Download, Search, DollarSign, Calendar, Mail, CheckCircle, XCircle } from 'lucide-react';

export default function ReceiptsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');

  const { data: receipts = [] } = useQuery({
    queryKey: ['admin-receipts'],
    queryFn: () => base44.asServiceRole.entities.Receipt.list('-created_date', 500),
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['admin-profiles-receipts'],
    queryFn: () => base44.asServiceRole.entities.UserProfile.list('-created_date', 1000),
  });

  // Calculate stats
  const totalRevenue = receipts.reduce((sum, r) => sum + (r.amount_paid || 0), 0);
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const monthlyRevenue = receipts.filter(r => {
    const date = new Date(r.purchase_date);
    return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
  }).reduce((sum, r) => sum + (r.amount_paid || 0), 0);

  const receiptsSent = receipts.filter(r => r.receipt_sent).length;
  const uniqueCustomers = [...new Set(receipts.map(r => r.user_profile_id))].length;

  // Filter receipts
  const filteredReceipts = receipts.filter(r => {
    const matchesSearch = r.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = filterPlan === 'all' || r.plan_name?.toLowerCase().includes(filterPlan);
    const matchesMonth = filterMonth === 'all' || new Date(r.purchase_date).getMonth() === parseInt(filterMonth);
    return matchesSearch && matchesPlan && matchesMonth;
  });

  const exportToCSV = () => {
    const headers = ['Transaction ID', 'Date', 'Customer', 'Email', 'Plan', 'Amount', 'Currency', 'Discount'];
    const rows = filteredReceipts.map(r => [
      r.transaction_id,
      new Date(r.purchase_date).toLocaleDateString(),
      r.customer_name,
      r.customer_email,
      `${r.plan_name} (${r.billing_period})`,
      r.amount_paid,
      r.currency,
      r.regional_discount ? 'Yes' : 'No'
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipts_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500 rounded-xl">
                <DollarSign size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-700">${totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500 rounded-xl">
                <Calendar size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-blue-700">${monthlyRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500 rounded-xl">
                <Receipt size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Receipts</p>
                <p className="text-2xl font-bold text-purple-700">{receipts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500 rounded-xl">
                <Mail size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Receipts Sent</p>
                <p className="text-2xl font-bold text-amber-700">{receiptsSent}/{receipts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Search size={20} />
              Search & Filter
            </span>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download size={16} className="mr-2" />
              Export CSV
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by transaction ID, email, or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterPlan} onValueChange={setFilterPlan}>
              <SelectTrigger>
                <SelectValue placeholder="All Plans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="elite">Elite</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger>
                <SelectValue placeholder="All Months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {[...Array(12)].map((_, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Receipts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Receipts ({filteredReceipts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredReceipts.map(receipt => {
              const profile = profiles.find(p => p.id === receipt.user_profile_id);
              
              return (
                <div key={receipt.id} className="p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Receipt size={18} className="text-purple-600" />
                        <span className="font-mono text-sm font-semibold">{receipt.transaction_id}</span>
                        {receipt.receipt_sent ? (
                          <CheckCircle size={16} className="text-green-500" />
                        ) : (
                          <XCircle size={16} className="text-red-500" />
                        )}
                        {receipt.regional_discount && (
                          <Badge className="bg-green-600 text-xs">50% Discount</Badge>
                        )}
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Customer</p>
                          <p className="font-medium">{receipt.customer_name}</p>
                          <p className="text-gray-500 text-xs">{receipt.customer_email}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Plan</p>
                          <p className="font-medium capitalize">{receipt.plan_name} ({receipt.billing_period})</p>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4 mt-3 text-sm">
                        <div>
                          <p className="text-gray-600">Purchase Date</p>
                          <p className="font-medium">{new Date(receipt.purchase_date).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Subscription Period</p>
                          <p className="font-medium text-xs">
                            {new Date(receipt.subscription_start_date).toLocaleDateString()} - {new Date(receipt.subscription_end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Provider</p>
                          <p className="font-medium capitalize">{receipt.payment_provider}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <p className="text-2xl font-bold text-green-600">
                        ${receipt.amount_paid.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">{receipt.currency}</p>
                      <Badge className={receipt.receipt_sent ? 'bg-green-600 mt-2' : 'bg-gray-600 mt-2'}>
                        {receipt.receipt_sent ? 'Sent' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {filteredReceipts.length === 0 && (
              <p className="text-center text-gray-500 py-8">No receipts found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}