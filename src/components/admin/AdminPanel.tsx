/**
 * Admin Panel Component
 *
 * Administrative interface for managing users, subscriptions, and viewing platform stats.
 * Only accessible to admin users (check via Supabase RLS).
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  Search,
  ChevronDown,
  Shield,
  ShieldAlert,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types/database';
import { Toast } from '../Toast';
import type { ToastType } from '../Toast';

interface UserWithStats extends Profile {
  email?: string;
  predictionsCount?: number;
  lastActive?: string;
}

interface PlatformStats {
  totalUsers: number;
  proUsers: number;
  freeUsers: number;
  totalPredictions: number;
  monthlyRevenue: number;
  activeThisWeek: number;
}

export const AdminPanel: React.FC = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pro' | 'free'>('all');
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  useEffect(() => {
    // Filter users based on search and status
    let filtered = users;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(u => u.subscription_tier === filterStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.email?.toLowerCase().includes(query) ||
        u.full_name?.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchQuery, filterStatus]);

  const fetchStats = async () => {
    try {
      // Get user counts
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: proUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_tier', 'pro');

      const { count: activeThisWeek } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // Get prediction count
      const { count: totalPredictions } = await supabase
        .from('predictions')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: totalUsers || 0,
        proUsers: proUsers || 0,
        freeUsers: (totalUsers || 0) - (proUsers || 0),
        totalPredictions: totalPredictions || 0,
        monthlyRevenue: (proUsers || 0) * 9, // Assuming $9/month avg
        activeThisWeek: activeThisWeek || 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get prediction counts for each user
      const usersWithStats = await Promise.all(
        (data || []).map(async (user) => {
          const { count } = await supabase
            .from('predictions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          // Get email from auth (requires service role)
          // For now, we'll use a placeholder or get it from profile
          return {
            ...user,
            email: user.email || undefined,
            predictionsCount: count || 0,
          };
        })
      );

      setUsers(usersWithStats);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setToast({ type: 'error', message: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  const updateSubscription = async (userId: string, tier: 'free' | 'pro', status: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_tier: tier,
          subscription_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      setToast({ type: 'success', message: 'Subscription updated' });
      fetchUsers();
      fetchStats();
    } catch (error) {
      setToast({ type: 'error', message: 'Failed to update subscription' });
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
  }) => (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 mt-1">Manage users and view platform statistics</p>
        </div>
        <button
          onClick={() => {
            fetchStats();
            fetchUsers();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={Users}
            color="bg-blue-500/20"
          />
          <StatCard
            title="Pro Subscribers"
            value={stats.proUsers}
            icon={Shield}
            color="bg-green-500/20"
          />
          <StatCard
            title="Total Predictions"
            value={stats.totalPredictions}
            icon={Activity}
            color="bg-purple-500/20"
          />
          <StatCard
            title="Monthly Revenue"
            value={`$${stats.monthlyRevenue}`}
            icon={DollarSign}
            color="bg-orange-500/20"
          />
        </div>
      )}

      {/* Users Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Users</h2>
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>

            {/* Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Users</option>
              <option value="pro">Pro Only</option>
              <option value="free">Free Only</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Predictions
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {user.full_name || 'Unnamed User'}
                        </div>
                        <div className="text-xs text-slate-400">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                        user.subscription_tier === 'pro'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-slate-600/50 text-slate-300'
                      }`}>
                        {user.subscription_tier === 'pro' ? (
                          <Shield className="w-3.5 h-3.5" />
                        ) : (
                          <ShieldAlert className="w-3.5 h-3.5" />
                        )}
                        {user.subscription_tier}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                        user.subscription_status === 'active'
                          ? 'bg-green-500/20 text-green-400'
                          : user.subscription_status === 'canceled'
                          ? 'bg-red-500/20 text-red-400'
                          : user.subscription_status === 'past_due'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-slate-600/50 text-slate-400'
                      }`}>
                        {user.subscription_status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {user.predictionsCount || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.subscription_tier === 'free' ? (
                          <button
                            onClick={() => updateSubscription(user.id, 'pro', 'active')}
                            className="p-2 text-green-400 hover:bg-green-400/20 rounded-lg transition-colors"
                            title="Upgrade to Pro"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => updateSubscription(user.id, 'free', 'canceled')}
                            className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors"
                            title="Downgrade to Free"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default AdminPanel;
