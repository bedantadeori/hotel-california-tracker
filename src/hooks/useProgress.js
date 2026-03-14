import { useState, useEffect, useCallback } from 'react';
import planData from '../data/plan.json';
import { supabase } from '../lib/supabase';

export function useProgress() {
  const [userId, setUserId] = useState(null);
  const [completedTasks, setCompletedTasks] = useState({});
  const [completedDays, setCompletedDays] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Listen for auth state — this fires on login, logout, and on page load if session exists
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const uid = session?.user?.id ?? null;
        setUserId(uid);
        if (!uid) {
          // Logged out — clear state
          setCompletedTasks({});
          setCompletedDays([]);
          setIsLoading(false);
          return;
        }

        // Logged in — load progress
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', uid)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.error('Error fetching progress:', error);
          }

          if (data) {
            setCompletedTasks(data.completed_tasks || {});
            setCompletedDays(data.completed_days || []);
          }
        } catch (e) {
          console.error('Failed to load data', e);
        } finally {
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const syncToSupabase = useCallback(async (tasks, days) => {
    if (!userId) return;
    setSyncing(true);
    try {
      // upsert prevents duplicate rows — creates row if not exists, updates if it does
      const { error } = await supabase
        .from('user_progress')
        .upsert(
          {
            user_id: userId,
            completed_tasks: tasks,
            completed_days: days,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        );
      if (error) throw error;
    } catch (e) {
      console.error('Failed to sync to Supabase', e);
    } finally {
      setSyncing(false);
    }
  }, [userId]);

  const toggleTask = (dayId, taskIndex) => {
    setCompletedTasks(prev => {
      const dayTasks = prev[dayId] || [];
      const updatedTasks = dayTasks.includes(taskIndex)
        ? dayTasks.filter(idx => idx !== taskIndex)
        : [...dayTasks, taskIndex];

      const newState = { ...prev, [dayId]: updatedTasks };

      // Auto-check for day completion — only count actionable tasks (not Resource/Daily Motivation)
      let newDays = [...completedDays];
      const dayData = planData.find(d => d.day === dayId);
      if (dayData) {
        const actionableCount = dayData.tasks.filter(
          t => t.category !== 'Daily Motivation' && t.category !== 'Resource'
        ).length;
        if (updatedTasks.length >= actionableCount && actionableCount > 0) {
          if (!newDays.includes(dayId)) {
            newDays = [...newDays, dayId].sort((a, b) => a - b);
          }
        } else {
          newDays = newDays.filter(id => id !== dayId);
        }
      }

      setCompletedDays(newDays);
      syncToSupabase(newState, newDays);

      return newState;
    });
  };

  const isDayUnlocked = (dayId) => {
    if (dayId === 1) return true;
    return completedDays.includes(dayId - 1);
  };

  const isDayCompleted = (dayId) => completedDays.includes(dayId);

  const getDayProgress = (dayId) => {
    const dayData = planData.find(d => d.day === dayId);
    if (!dayData) return 0;
    const comps = completedTasks[dayId]?.length || 0;
    return Math.round((comps / dayData.tasks.length) * 100);
  };

  return {
    userId,
    completedTasks,
    completedDays,
    toggleTask,
    isDayUnlocked,
    isDayCompleted,
    getDayProgress,
    isLoading,
    syncing
  };
}
