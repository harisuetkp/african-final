import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Mail, Loader2, Send } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function WaitlistManagement({ onSendEmail }) {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['admin-waitlist'],
    queryFn: () => base44.entities.WaitlistEntry.list('-created_date', 500)
  });

  const filteredEntries = entries.filter(entry => 
    entry.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Mail className="h-6 w-6 text-purple-600" />
              Waitlist Entries ({entries.length})
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            {onSendEmail && (
              <Button onClick={onSendEmail} className="bg-purple-600 hover:bg-purple-700 gap-2">
                <Send size={16} />
                Send Launch Email
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.full_name}</TableCell>
                      <TableCell>{entry.email}</TableCell>
                      <TableCell>{entry.location || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={
                          entry.status === 'joined' ? 'success' :
                          entry.status === 'invited' ? 'secondary' : 'default'
                        }>
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(entry.created_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={entry.reason}>
                        {entry.reason || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredEntries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No entries found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}