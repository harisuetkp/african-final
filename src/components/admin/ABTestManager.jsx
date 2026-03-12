import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Play, Pause, Trophy, TrendingUp } from 'lucide-react';

export default function ABTestManager() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTest, setNewTest] = useState({
    test_name: '',
    test_type: 'pricing',
    variant_a: {},
    variant_b: {},
    traffic_split: 50,
    is_active: true
  });
  const queryClient = useQueryClient();

  // Fetch active tests
  const { data: activeTests = [] } = useQuery({
    queryKey: ['ab-tests-active'],
    queryFn: () => base44.entities.ABTest.filter({ is_active: true }, '-started_at')
  });

  // Fetch user assignments
  const { data: testAssignments = [] } = useQuery({
    queryKey: ['ab-test-assignments'],
    queryFn: () => base44.entities.ABTest.list('-assigned_at', 1000)
  });

  // Fetch analytics for conversions
  const { data: analytics = [] } = useQuery({
    queryKey: ['ab-test-analytics'],
    queryFn: () => base44.entities.ProfileAnalytics.filter({
      event_type: { $regex: 'ab_test' }
    }, '-created_date', 5000)
  });

  const createTestMutation = useMutation({
    mutationFn: async (testData) => {
      // Create the test configuration (this will be used by the hook)
      return await base44.entities.ABTest.create({
        ...testData,
        user_id: 'config', // Special marker for config records
        variant: 'config',
        test_name: testData.test_name,
        started_at: new Date().toISOString(),
        metrics: {
          variant_a_conversions: 0,
          variant_a_views: 0,
          variant_b_conversions: 0,
          variant_b_views: 0
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ab-tests-active']);
      setShowCreateModal(false);
      resetForm();
    }
  });

  const toggleTestMutation = useMutation({
    mutationFn: ({ id, isActive }) => 
      base44.entities.ABTest.update(id, { 
        is_active: !isActive,
        ended_at: !isActive ? null : new Date().toISOString()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['ab-tests-active']);
    }
  });

  const declareWinnerMutation = useMutation({
    mutationFn: ({ id, winner }) =>
      base44.entities.ABTest.update(id, {
        winner,
        is_active: false,
        ended_at: new Date().toISOString()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['ab-tests-active']);
    }
  });

  const resetForm = () => {
    setNewTest({
      test_name: '',
      test_type: 'pricing',
      variant_a: {},
      variant_b: {},
      traffic_split: 50,
      is_active: true
    });
  };

  // Calculate test statistics
  const calculateTestStats = (test) => {
    const assignments = testAssignments.filter(a => 
      a.test_name === test.test_name && a.user_id !== 'config'
    );

    const variantAUsers = assignments.filter(a => a.variant === 'A').length;
    const variantBUsers = assignments.filter(a => a.variant === 'B').length;

    const conversions = analytics.filter(a => 
      a.event_data?.test_name === test.test_name
    );

    const variantAConversions = conversions.filter(c => c.event_data?.variant === 'A').length;
    const variantBConversions = conversions.filter(c => c.event_data?.variant === 'B').length;

    const variantARate = variantAUsers > 0 ? (variantAConversions / variantAUsers * 100) : 0;
    const variantBRate = variantBUsers > 0 ? (variantBConversions / variantBUsers * 100) : 0;

    const improvement = variantARate > 0 ? ((variantBRate - variantARate) / variantARate * 100) : 0;

    return {
      variantAUsers,
      variantBUsers,
      variantAConversions,
      variantBConversions,
      variantARate: variantARate.toFixed(2),
      variantBRate: variantBRate.toFixed(2),
      improvement: improvement.toFixed(2),
      winner: variantBRate > variantARate ? 'B' : 'A'
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">A/B Test Manager</h2>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus size={18} className="mr-2" />
          Create Test
        </Button>
      </div>

      {/* Active Tests */}
      <div className="grid md:grid-cols-2 gap-6">
        {activeTests.filter(t => t.user_id === 'config').map(test => {
          const stats = calculateTestStats(test);
          
          return (
            <Card key={test.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{test.test_name}</CardTitle>
                  <Badge variant={test.is_active ? 'default' : 'secondary'}>
                    {test.is_active ? 'Active' : 'Paused'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 capitalize">{test.test_type}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Variant A */}
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Variant A (Control)</span>
                      <Badge variant="outline">{stats.variantAUsers} users</Badge>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.variantARate}%
                    </div>
                    <p className="text-sm text-gray-600">
                      {stats.variantAConversions} conversions
                    </p>
                  </div>

                  {/* Variant B */}
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Variant B (Test)</span>
                      <Badge variant="outline">{stats.variantBUsers} users</Badge>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      {stats.variantBRate}%
                    </div>
                    <p className="text-sm text-gray-600">
                      {stats.variantBConversions} conversions
                    </p>
                  </div>

                  {/* Results */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={16} className={
                        parseFloat(stats.improvement) > 0 ? 'text-green-600' : 'text-red-600'
                      } />
                      <span className="font-semibold">
                        {parseFloat(stats.improvement) > 0 ? '+' : ''}{stats.improvement}% 
                        {parseFloat(stats.improvement) > 0 ? ' improvement' : ' decrease'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Variant {stats.winner} is performing better
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleTestMutation.mutate({
                        id: test.id,
                        isActive: test.is_active
                      })}
                      className="flex-1"
                    >
                      {test.is_active ? (
                        <>
                          <Pause size={14} className="mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play size={14} className="mr-1" />
                          Resume
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => declareWinnerMutation.mutate({
                        id: test.id,
                        winner: `variant_${stats.winner.toLowerCase()}`
                      })}
                      className="flex-1"
                    >
                      <Trophy size={14} className="mr-1" />
                      Declare Winner
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {activeTests.filter(t => t.user_id === 'config').length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 mb-4">No active A/B tests</p>
            <Button onClick={() => setShowCreateModal(true)}>
              Create Your First Test
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Test Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create A/B Test</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Test Name</Label>
              <Input
                value={newTest.test_name}
                onChange={(e) => setNewTest({ ...newTest, test_name: e.target.value })}
                placeholder="e.g., premium_pricing_2025"
              />
            </div>

            <div>
              <Label>Test Type</Label>
              <Select
                value={newTest.test_type}
                onValueChange={(v) => setNewTest({ ...newTest, test_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pricing">Pricing</SelectItem>
                  <SelectItem value="paywall_copy">Paywall Copy</SelectItem>
                  <SelectItem value="cta_placement">CTA Placement</SelectItem>
                  <SelectItem value="feature">Feature Toggle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Traffic Split (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={newTest.traffic_split}
                onChange={(e) => setNewTest({ ...newTest, traffic_split: parseInt(e.target.value) })}
              />
              <p className="text-xs text-gray-500 mt-1">
                % of users who will see Variant B
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Variant A (Control)</Label>
                <Input
                  placeholder="e.g., $9.99"
                  onChange={(e) => setNewTest({ 
                    ...newTest, 
                    variant_a: { value: e.target.value } 
                  })}
                />
              </div>
              <div>
                <Label>Variant B (Test)</Label>
                <Input
                  placeholder="e.g., $14.99"
                  onChange={(e) => setNewTest({ 
                    ...newTest, 
                    variant_b: { value: e.target.value } 
                  })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => createTestMutation.mutate(newTest)}>
              Create Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}