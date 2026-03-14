import { useState, useEffect, useCallback } from 'react';
import planData from '../data/plan.json';
import { supabase } from '../lib/supabase';

export function useProgress() {
  const [userId, setUserId] = useState(null);
  const [completedTasks, setCompletedTasks] = useState({});
  const [completedDays, setCompletedDays] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Fetch the user's saved progress from Supabase
  const loadData = useCallback(async (uid) => {
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
      } else {
        // No row yet — start fresh with empty progress (will be created on first task completion)
        setCompletedTasks({});
        setCompletedDays([]);
      }
    } catch (e) {
      console.error('Failed to load data', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Immediately check for an existing session (handles page load / refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        loadData(uid);
      } else {
        setIsLoading(false);
      }
    });

    // 2. Listen for future auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const uid = session?.user?.id ?? null;
        setUserId(uid);
        if (!uid) {
          setCompletedTasks({});
          setCompletedDays([]);
          setIsLoading(false);
        }
        // Note: data loading is handled by getSession() on mount and by
        // explicit sign-in. onAuthStateChange handles sign-out only here.
      }
    );

    return () => subscription.unsubscribe();
  }, [loadData]);

  const syncToSupabase = useCallback(async (tasks, days) => {
    if (!userId) return;
    setSyncing(true);
    try {
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
