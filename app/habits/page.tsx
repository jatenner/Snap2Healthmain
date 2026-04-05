'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/client/ClientAuthProvider';
import AuthGate from '../components/AuthGate';
import {
  ArrowLeft, Repeat, Plus, Trash2, Loader2, Clock, Coffee, Wine,
  Pill, Droplets, Cookie, UtensilsCrossed, Check, Pencil, Power,
  X, ChevronDown
} from 'lucide-react';

interface Habit {
  id: string;
  name: string;
  intake_type: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time_of_day: string;
  frequency: string;
  active: boolean;
  last_logged_date: string | null;
  created_at: string;
}

const TYPE_ICONS: Record<string, { icon: any; color: string; label: string }> = {
  meal: { icon: UtensilsCrossed, color: 'text-gray-500', label: 'Meal' },
  snack: { icon: Cookie, color: 'text-orange-500', label: 'Snack' },
  drink: { icon: Coffee, color: 'text-amber-600', label: 'Drink' },
  alcohol: { icon: Wine, color: 'text-purple-500', label: 'Alcohol' },
  supplement: { icon: Pill, color: 'text-green-500', label: 'Supplement' },
  hydration: { icon: Droplets, color: 'text-blue-500', label: 'Water' },
};

function HabitIcon({ type }: { type: string }) {
  const config = TYPE_ICONS[type] ?? TYPE_ICONS.meal!;
  const Icon = config!.icon;
  return <Icon className={`w-4 h-4 ${config!.color}`} />;
}

function formatTime(time: string) {
  if (!time) return '';
  const parts = time.split(':').map(Number);
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Create form state
  const [newDescription, setNewDescription] = useState('');
  const [newTime, setNewTime] = useState('08:00');
  const [newFrequency, setNewFrequency] = useState<string>('daily');
  const [isCreating, setIsCreating] = useState(false);

  // Edit form state
  const [editTime, setEditTime] = useState('');
  const [editFrequency, setEditFrequency] = useState('');

  const router = useRouter();
  const { user } = useAuth();

  // Fetch habits
  useEffect(() => {
    fetch('/api/habits')
      .then(r => r.json())
      .then(data => setHabits(data.habits || []))
      .catch(() => setError('Failed to load habits'))
      .finally(() => setLoading(false));
  }, []);

  // Create habit from freeform text
  const handleCreate = async () => {
    if (!newDescription.trim()) return;
    setIsCreating(true);
    setError('');

    try {
      // Step 1: Analyze with GPT
      const analyzeRes = await fetch('/api/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: newDescription.trim() }),
      });

      if (!analyzeRes.ok) {
        const err = await analyzeRes.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to analyze');
      }

      const analysis = await analyzeRes.json();

      // Step 2: Save as habit
      const habitRes = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: analysis.name || newDescription.trim(),
          intakeType: analysis.consumptionType || 'meal',
          timeOfDay: newTime,
          frequency: newFrequency,
          nutrients: {
            calories: analysis.calories || 0,
            protein: analysis.protein || 0,
            carbs: analysis.carbs || 0,
            fat: analysis.fat || 0,
            macronutrients: analysis.macronutrients || [],
            micronutrients: analysis.micronutrients || [],
          },
        }),
      });

      if (!habitRes.ok) throw new Error('Failed to save habit');

      const data = await habitRes.json();
      setHabits(prev => [...prev, { ...data.habit, active: true, calories: analysis.calories || 0, protein: analysis.protein || 0, carbs: analysis.carbs || 0, fat: analysis.fat || 0 }]);
      setSuccess(`"${newDescription.trim()}" added as ${newFrequency} habit`);
      setNewDescription('');
      setShowCreate(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create habit');
    } finally {
      setIsCreating(false);
    }
  };

  // Toggle habit active/inactive
  const handleToggle = async (habit: Habit) => {
    setActionLoading(habit.id);
    try {
      const res = await fetch('/api/habits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitId: habit.id, active: !habit.active }),
      });
      if (res.ok) {
        setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, active: !h.active } : h));
      }
    } catch {}
    setActionLoading(null);
  };

  // Save edit (time/frequency)
  const handleSaveEdit = async (habitId: string) => {
    setActionLoading(habitId);
    try {
      const updates: any = {};
      if (editTime) updates.timeOfDay = editTime;
      if (editFrequency) updates.frequency = editFrequency;
      updates.habitId = habitId;

      const res = await fetch('/api/habits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        setHabits(prev => prev.map(h => h.id === habitId ? {
          ...h,
          time_of_day: editTime || h.time_of_day,
          frequency: editFrequency || h.frequency,
        } : h));
        setEditingId(null);
      }
    } catch {}
    setActionLoading(null);
  };

  // Delete habit
  const handleDelete = async (habitId: string) => {
    setActionLoading(habitId);
    try {
      const res = await fetch(`/api/habits?id=${habitId}`, { method: 'DELETE' });
      if (res.ok) {
        setHabits(prev => prev.filter(h => h.id !== habitId));
      }
    } catch {}
    setActionLoading(null);
  };

  const activeHabits = habits.filter(h => h.active);
  const pausedHabits = habits.filter(h => !h.active);

  return (
    <AuthGate>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto px-4 py-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Daily Patterns</h1>
                <p className="text-xs text-gray-400">Auto-logged every day so you don't have to</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl transition-colors"
            >
              {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>

          {/* Success */}
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <p className="text-green-700 text-sm font-medium">{success}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Create new habit */}
          {showCreate && (
            <div className="mb-6 bg-white border border-blue-200 rounded-2xl p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">New Daily Pattern</h3>
              <p className="text-xs text-gray-400 mb-3">
                Describe what you consume regularly. We'll analyze the nutrition once and auto-log it for you going forward.
              </p>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder={"Describe what you have regularly...\n\nExamples:\n\u2022 Tablespoon of olive oil\n\u2022 Black coffee with cream\n\u2022 Two eggs and toast\n\u2022 Fish oil and vitamin D supplement\n\u2022 Glass of water with lemon"}
                className="w-full bg-gray-50 text-gray-900 placeholder-gray-400 text-sm rounded-xl p-3 resize-none outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                rows={4}
              />
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 outline-none"
                  />
                </div>
                <select
                  value={newFrequency}
                  onChange={(e) => setNewFrequency(e.target.value)}
                  className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 outline-none"
                >
                  <option value="daily">Every day</option>
                  <option value="weekdays">Weekdays</option>
                  <option value="weekends">Weekends</option>
                </select>
              </div>
              <button
                onClick={handleCreate}
                disabled={isCreating || !newDescription.trim()}
                className="mt-3 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {isCreating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing & saving...</>
                ) : (
                  <><Repeat className="w-4 h-4" /> Analyze & Add Pattern</>
                )}
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          )}

          {/* Empty state */}
          {!loading && habits.length === 0 && !showCreate && (
            <div className="text-center py-16">
              <Repeat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No daily patterns yet</p>
              <p className="text-sm text-gray-400 mt-1 mb-4">
                Add things you consume regularly — coffee, supplements, water — and they'll be logged automatically.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Your First Pattern
              </button>
            </div>
          )}

          {/* Active habits */}
          {!loading && activeHabits.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Active ({activeHabits.length})
              </h2>
              <div className="space-y-2">
                {activeHabits.map(habit => (
                  <div key={habit.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    {editingId === habit.id ? (
                      /* Edit mode */
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <HabitIcon type={habit.intake_type} />
                          <span className="text-sm font-semibold text-gray-900">{habit.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <input
                              type="time"
                              value={editTime}
                              onChange={(e) => setEditTime(e.target.value)}
                              className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 outline-none"
                            />
                          </div>
                          <select
                            value={editFrequency}
                            onChange={(e) => setEditFrequency(e.target.value)}
                            className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 outline-none"
                          >
                            <option value="daily">Every day</option>
                            <option value="weekdays">Weekdays</option>
                            <option value="weekends">Weekends</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(habit.id)}
                            disabled={actionLoading === habit.id}
                            className="flex-1 bg-blue-600 text-white text-sm py-2 rounded-lg font-medium"
                          >
                            {actionLoading === habit.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 bg-gray-100 text-gray-600 text-sm py-2 rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display mode */
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                          <HabitIcon type={habit.intake_type} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{habit.name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                            <span>{formatTime(habit.time_of_day)}</span>
                            <span>·</span>
                            <span className="capitalize">{habit.frequency}</span>
                            {habit.calories > 0 && (
                              <>
                                <span>·</span>
                                <span>{habit.calories} cal</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => { setEditingId(habit.id); setEditTime(habit.time_of_day?.slice(0, 5) || '08:00'); setEditFrequency(habit.frequency); }}
                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggle(habit)}
                            disabled={actionLoading === habit.id}
                            className="p-1.5 text-gray-400 hover:text-yellow-600 rounded-lg hover:bg-yellow-50"
                            title="Pause"
                          >
                            {actionLoading === habit.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDelete(habit.id)}
                            disabled={actionLoading === habit.id}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Paused habits */}
          {!loading && pausedHabits.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Paused ({pausedHabits.length})
              </h2>
              <div className="space-y-2">
                {pausedHabits.map(habit => (
                  <div key={habit.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                        <HabitIcon type={habit.intake_type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-600 truncate">{habit.name}</p>
                        <p className="text-xs text-gray-400">{formatTime(habit.time_of_day)} · {habit.frequency}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleToggle(habit)}
                          disabled={actionLoading === habit.id}
                          className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50"
                          title="Resume"
                        >
                          {actionLoading === habit.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDelete(habit.id)}
                          disabled={actionLoading === habit.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </AuthGate>
  );
}
