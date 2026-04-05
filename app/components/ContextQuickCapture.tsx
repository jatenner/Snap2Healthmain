'use client';

import React, { useState } from 'react';
import { Battery, BrainCircuit, Check, Frown, Meh, Smile, SmilePlus, Zap } from 'lucide-react';

const ENERGY_LEVELS = [
  { value: 1, label: 'Exhausted', icon: Frown, color: 'text-red-500 bg-red-50 border-red-200' },
  { value: 2, label: 'Low', icon: Frown, color: 'text-orange-500 bg-orange-50 border-orange-200' },
  { value: 3, label: 'OK', icon: Meh, color: 'text-yellow-500 bg-yellow-50 border-yellow-200' },
  { value: 4, label: 'Good', icon: Smile, color: 'text-green-500 bg-green-50 border-green-200' },
  { value: 5, label: 'Great', icon: SmilePlus, color: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
];

const STRESS_LEVELS = [
  { value: 2, label: 'Low', color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 5, label: 'Medium', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  { value: 8, label: 'High', color: 'text-red-600 bg-red-50 border-red-200' },
];

const SYMPTOM_TAGS = [
  { value: 'headache', label: 'Headache' },
  { value: 'bloated', label: 'Bloated' },
  { value: 'brain_fog', label: 'Brain Fog' },
  { value: 'fatigue', label: 'Fatigue' },
  { value: 'anxious', label: 'Anxious' },
  { value: 'great', label: 'Feeling Great' },
];

export default function ContextQuickCapture() {
  const [logged, setLogged] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const logContext = async (eventType: string, value: string, numericValue: number) => {
    setLoading(true);
    try {
      const res = await fetch('/api/context-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          value,
          numericValue,
          source: 'quick_capture',
        }),
      });
      if (res.ok) {
        setLogged(`${value}`);
        setTimeout(() => setLogged(null), 2500);
      }
    } catch (e) {
      console.error('Failed to log context:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <BrainCircuit className="w-4 h-4 text-purple-500" />
        How are you feeling?
      </h3>

      {logged && (
        <div className="mb-3 flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg px-3 py-1.5">
          <Check className="w-3.5 h-3.5" /> Logged: {logged}
        </div>
      )}

      {/* Energy Level */}
      <div className="mb-3">
        <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
          <Battery className="w-3 h-3" /> Energy
        </p>
        <div className="flex gap-1.5">
          {ENERGY_LEVELS.map(level => {
            const Icon = level.icon;
            return (
              <button
                key={level.value}
                onClick={() => logContext('energy', level.label.toLowerCase(), level.value * 2)}
                disabled={loading}
                className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors hover:opacity-80 disabled:opacity-50 ${level.color}`}
                title={level.label}
              >
                <Icon className="w-3.5 h-3.5 mx-auto" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Stress Level */}
      <div className="mb-3">
        <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
          <Zap className="w-3 h-3" /> Stress
        </p>
        <div className="flex gap-1.5">
          {STRESS_LEVELS.map(level => (
            <button
              key={level.value}
              onClick={() => logContext('stress', level.label.toLowerCase(), level.value)}
              disabled={loading}
              className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors hover:opacity-80 disabled:opacity-50 ${level.color}`}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      {/* Symptom Tags */}
      <div>
        <p className="text-xs text-gray-500 mb-1.5">Symptoms</p>
        <div className="flex flex-wrap gap-1.5">
          {SYMPTOM_TAGS.map(tag => (
            <button
              key={tag.value}
              onClick={() => logContext('symptom', tag.value, tag.value === 'great' ? 1 : 7)}
              disabled={loading}
              className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors hover:opacity-80 disabled:opacity-50 ${
                tag.value === 'great'
                  ? 'text-green-600 bg-green-50 border-green-200'
                  : 'text-gray-600 bg-gray-50 border-gray-200'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
