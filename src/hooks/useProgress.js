import { useState, useEffect, useCallback } from 'react';
import planData from '../data/plan.json';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export function useProgress() {
  const [userId, setUserId] = useState(() => {
    let id = localStorage.getItem('hc_user_id');
    if (!id) {
      id = uuidv4();
      localStorage.setItem('hc_user_id', id);
    }
    return id;
  });

  const [completedTasks, setCompletedTasks] = useState({});
  const [completedDays, setCompletedDays] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Load initial data from Supabase
  useEffect(() => {
    async function loadData() {
      try {
        const { data, error } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching progress:', error);
        }

        if (data) {
          setCompletedTasks(data.completed_tasks || {});
          setCompletedDays(data.completed_days || []);
        } else {
          // Initialize empty progress if nothing exists
          await supabase.from('user_progress').insert({
            user_id: userId,
            completed_tasks: {},
            completed_days: []
          });
        }
      } catch (e) {
        console.error('Failed to load data', e);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [userId]);

  const syncToSupabase = useCallback(async (tasks, days) => {
    setSyncing(true);
    try {
      await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          completed_tasks: tasks,
          completed_days: days,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
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
      
      // Auto-check for day completion
      let newDays = [...completedDays];
      const dayData = planData.find(d => d.day === dayId);
      if (dayData) {
        const totalTasks = dayData.tasks.length;
        if (updatedTasks.length === totalTasks) {
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

  const isDayCompleted = (dayId) => {
    return completedDays.includes(dayId);
  };

  const getDayProgress = (dayId) => {
    const dayData = planData.find(d => d.day === dayId);
    if (!dayData) return 0;
    const comps = completedTasks[dayId]?.length || 0;
    return Math.round((comps / dayData.tasks.length) * 100);
  };

  return {
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
