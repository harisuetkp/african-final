import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  MessageSquare, Image, Zap, RefreshCw, Plus, Edit, Trash2,
  Check, X, Eye, Search
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminContent() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [iceBreakers, setIceBreakers] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [editDialog, setEditDialog] = useState({ open: false, type: null, item: null });
  const [formData, setFormData] = useState({ text: "", category: "", is_active: true });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (!currentUser || currentUser.role !== 'admin') {
        navigate(createPageUrl('Home'));
        return;
      }
      setUser(currentUser);
      await loadContent();
    } catch (error) {
      navigate(createPageUrl('Home'));
    }
  };

  const loadContent = async () => {
    setLoading(true);
    try {
      const [breakers] = await Promise.all([
        base44.entities.IceBreaker?.list('-created_date', 100) || []
      ]);
      setIceBreakers(breakers);

      // Default prompts (could be stored in DB later)
      setPrompts([
        { id: 1, text: "I'm looking for someone who...", category: "relationship", is_active: true },
        { id: 2, text: "My ideal first date would be...", category: "dating", is_active: true },
        { id: 3, text: "The way to my heart is through...", category: "romance", is_active: true },
        { id: 4, text: "My favorite African dish is...", category: "culture", is_active: true },
        { id: 5, text: "I'm passionate about...", category: "interests", is_active: true },
        { id: 6, text: "My culture means to me...", category: "culture", is_active: true },
        { id: 7, text: "A typical Sunday for me looks like...", category: "lifestyle", is_active: true },
        { id: 8, text: "My friends would describe me as...", category: "personality", is_active: true },
      ]);
    } catch (error) {
      console.error('Error loading content:', error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      if (editDialog.type === 'icebreaker') {
        if (editDialog.item) {
          await base44.entities.IceBreaker.update(editDialog.item.id, formData);
        } else {
          await base44.entities.IceBreaker.create(formData);
        }
      }
      await loadContent();
      setEditDialog({ open: false, type: null, item: null });
      setFormData({ text: "", category: "", is_active: true });
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const handleDelete = async (type, id) => {
    try {
      if (type === 'icebreaker') {
        await base44.entities.IceBreaker.delete(id);
      }
      await loadContent();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const openEdit = (type, item = null) => {
    setFormData(item || { text: "", category: "", is_active: true });
    setEditDialog({ open: true, type, item });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <AdminSidebar activePage="AdminContent" />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Content Management</h1>
              <p className="text-sm text-slate-400">Manage app content and prompts</p>
            </div>
            <Button onClick={loadContent} className="bg-orange-500 hover:bg-orange-600">
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </div>
        </header>

        <div className="p-6">
          <Tabs defaultValue="icebreakers" className="space-y-6">
            <TabsList className="bg-slate-800">
              <TabsTrigger value="icebreakers" className="data-[state=active]:bg-orange-500">
                <Zap className="w-4 h-4 mr-2" /> Ice Breakers
              </TabsTrigger>
              <TabsTrigger value="prompts" className="data-[state=active]:bg-orange-500">
                <MessageSquare className="w-4 h-4 mr-2" /> Profile Prompts
              </TabsTrigger>
            </TabsList>

            {/* Ice Breakers */}
            <TabsContent value="icebreakers" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-slate-400">{iceBreakers.length} ice breakers</p>
                <Button onClick={() => openEdit('icebreaker')} className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="w-4 h-4 mr-2" /> Add Ice Breaker
                </Button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {iceBreakers.map((breaker) => (
                  <Card key={breaker.id} className="bg-slate-900 border-slate-800">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <Badge className={breaker.is_active ? 'bg-green-500' : 'bg-slate-500'}>
                          {breaker.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openEdit('icebreaker', breaker)}
                            className="text-slate-400 hover:text-white"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete('icebreaker', breaker.id)}
                            className="text-slate-400 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-white">{breaker.text}</p>
                      {breaker.category && (
                        <Badge className="mt-2 bg-slate-700">{breaker.category}</Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {iceBreakers.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <Zap className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No ice breakers yet</p>
                    <Button 
                      onClick={() => openEdit('icebreaker')} 
                      className="mt-4 bg-orange-500 hover:bg-orange-600"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add First Ice Breaker
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Profile Prompts */}
            <TabsContent value="prompts" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-slate-400">{prompts.length} prompts</p>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="w-4 h-4 mr-2" /> Add Prompt
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {prompts.map((prompt) => (
                  <Card key={prompt.id} className="bg-slate-900 border-slate-800">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-white font-medium">{prompt.text}</p>
                          <Badge className="mt-2 bg-slate-700 capitalize">{prompt.category}</Badge>
                        </div>
                        <Switch checked={prompt.is_active} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => !open && setEditDialog({ open: false, type: null, item: null })}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editDialog.item ? 'Edit' : 'Add'} {editDialog.type === 'icebreaker' ? 'Ice Breaker' : 'Prompt'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-slate-300">Text</Label>
              <Textarea
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                placeholder="Enter text..."
                className="mt-2 bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300">Category</Label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., romance, culture, lifestyle"
                className="mt-2 bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-slate-300">Active</Label>
              <Switch 
                checked={formData.is_active}
                onCheckedChange={(val) => setFormData({ ...formData, is_active: val })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditDialog({ open: false, type: null, item: null })}
              className="border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}