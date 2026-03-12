import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit2, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function ContestManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    month: new Date().toISOString().slice(0, 7),
    theme: '',
    prizes: { first: '', second: '', third: '' }
  });

  const queryClient = useQueryClient();

  const { data: contests = [] } = useQuery({
    queryKey: ['admin-contest-periods'],
    queryFn: () => base44.entities.ContestPeriod.list('-month', 20)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ContestPeriod.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-contest-periods']);
      setIsDialogOpen(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ContestPeriod.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-contest-periods']);
      setIsDialogOpen(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ContestPeriod.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['admin-contest-periods'])
  });

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      month: new Date().toISOString().slice(0, 7),
      theme: '',
      prizes: { first: '', second: '', third: '' }
    });
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (contest) => {
    setEditingId(contest.id);
    setFormData({
      month: contest.month,
      theme: contest.theme,
      prizes: contest.prizes || { first: '', second: '', third: '' }
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Contest Management</h2>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="mr-2 h-4 w-4" /> New Contest Month
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contest Periods & Prizes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Theme</TableHead>
                <TableHead>1st Prize</TableHead>
                <TableHead>2nd Prize</TableHead>
                <TableHead>3rd Prize</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contests.map((contest) => (
                <TableRow key={contest.id}>
                  <TableCell>{contest.month}</TableCell>
                  <TableCell>{contest.theme}</TableCell>
                  <TableCell>{contest.prizes?.first}</TableCell>
                  <TableCell>{contest.prizes?.second}</TableCell>
                  <TableCell>{contest.prizes?.third}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(contest)}>
                        <Edit2 className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(contest.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {contests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No contests configured yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Contest' : 'Create New Contest'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="month">Month (YYYY-MM)</Label>
              <Input
                id="month"
                type="month"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="theme">Theme</Label>
              <Input
                id="theme"
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                placeholder="e.g. Summer Love"
              />
            </div>
            <div className="grid gap-2">
              <Label>Prizes</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="1st Prize (e.g. $500)"
                  value={formData.prizes.first}
                  onChange={(e) => setFormData({ ...formData, prizes: { ...formData.prizes, first: e.target.value } })}
                />
                <Input
                  placeholder="2nd Prize (e.g. $250)"
                  value={formData.prizes.second}
                  onChange={(e) => setFormData({ ...formData, prizes: { ...formData.prizes, second: e.target.value } })}
                />
                <Input
                  placeholder="3rd Prize (e.g. $100)"
                  value={formData.prizes.third}
                  onChange={(e) => setFormData({ ...formData, prizes: { ...formData.prizes, third: e.target.value } })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-purple-600">
              {editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}