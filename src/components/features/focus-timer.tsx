'use client';

import { useState, useRef, useCallback, useEffect, memo } from 'react';
import { Timer, Play, Pause, RotateCcw, Coffee, X, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type TimerState = 'idle' | 'running' | 'paused';
type TimerMode = 'focus' | 'break';

const DEFAULT_FOCUS = 25;
const DEFAULT_BREAK = 5;
const SESSIONS_KEY = 'planner-focus-sessions';
const FOCUS_KEY = 'planner-focus-minutes';
const BREAK_KEY = 'planner-break-minutes';

function loadNumber(key: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback;
  const stored = localStorage.getItem(key);
  return stored ? parseInt(stored, 10) || fallback : fallback;
}

function loadSessions(): number {
  if (typeof window === 'undefined') return 0;
  const today = new Date().toISOString().split('T')[0];
  const raw = localStorage.getItem(SESSIONS_KEY);
  if (!raw) return 0;
  try {
    const data = JSON.parse(raw);
    return data.date === today ? data.count : 0;
  } catch {
    return 0;
  }
}

function saveSessions(count: number) {
  if (typeof window === 'undefined') return;
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(SESSIONS_KEY, JSON.stringify({ date: today, count }));
}

interface FocusTimerProps {
  onClose?: () => void;
  initialTaskId?: string;
  initialTaskName?: string;
}

export const FocusTimer = memo(function FocusTimer({ onClose, initialTaskName }: FocusTimerProps) {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [state, setState] = useState<TimerState>('idle');
  const [focusMinutes, setFocusMinutes] = useState(() => loadNumber(FOCUS_KEY, DEFAULT_FOCUS));
  const [breakMinutes, setBreakMinutes] = useState(() => loadNumber(BREAK_KEY, DEFAULT_BREAK));
  const [timeLeft, setTimeLeft] = useState(() => loadNumber(FOCUS_KEY, DEFAULT_FOCUS) * 60);
  const [sessions, setSessions] = useState(loadSessions);
  const [showSettings, setShowSettings] = useState(false);
  const activeTask = initialTaskName || '';
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const settingsRef = useRef({ focusMinutes, breakMinutes });

  useEffect(() => {
    settingsRef.current = { focusMinutes, breakMinutes };
  }, [focusMinutes, breakMinutes]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const totalSeconds = mode === 'focus' ? focusMinutes * 60 : breakMinutes * 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;

  const playNotification = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.3;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc.stop(audioCtx.currentTime + 0.5);
    } catch {}
  }, []);

  const tick = useCallback(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
        playNotification();
        const s = settingsRef.current;
        if (mode === 'focus') {
          setSessions((sessionCount) => {
            const newCount = sessionCount + 1;
            saveSessions(newCount);
            return newCount;
          });
          setMode('break');
          setTimeLeft(s.breakMinutes * 60);
          setState('running');
        } else {
          setMode('focus');
          setTimeLeft(s.focusMinutes * 60);
          setState('idle');
        }
        return 0;
      }
      return prev - 1;
    });
  }, [mode, playNotification]);

  const startTimer = useCallback(() => {
    setState('running');
    intervalRef.current = setInterval(tick, 1000);
  }, [tick]);

  const pauseTimer = useCallback(() => {
    setState('paused');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  const resetTimer = useCallback(() => {
    pauseTimer();
    setMode('focus');
    setTimeLeft(settingsRef.current.focusMinutes * 60);
    setState('idle');
  }, [pauseTimer]);

  const toggleTimer = useCallback(() => {
    if (state === 'running') pauseTimer();
    else startTimer();
  }, [state, pauseTimer, startTimer]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="fixed bottom-24 md:bottom-4 left-4 z-50 animate-fade-in-up">
      <div className="bg-background border rounded-2xl shadow-2xl p-5 w-64">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {mode === 'focus' ? (
              <Timer className="h-4 w-4 text-primary" />
            ) : (
              <Coffee className="h-4 w-4 text-amber-500" />
            )}
            <span className="text-xs font-semibold">{mode === 'focus' ? 'Focus' : 'Break'}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMode('focus')}
              className={cn(
                'text-[10px] px-2 py-0.5 rounded-md transition-colors',
                mode === 'focus' ? 'bg-primary/10 text-primary' : 'text-muted-foreground/50 hover:text-muted-foreground'
              )}
            >
              Focus
            </button>
            <button
              onClick={() => setMode('break')}
              className={cn(
                'text-[10px] px-2 py-0.5 rounded-md transition-colors',
                mode === 'break' ? 'bg-amber-500/10 text-amber-600' : 'text-muted-foreground/50 hover:text-muted-foreground'
              )}
            >
              Break
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                'p-0.5 rounded-md hover:bg-muted transition-colors',
                showSettings && 'bg-muted text-primary'
              )}
              aria-label="Timer settings"
            >
              <Settings2 className="h-3 w-3 text-muted-foreground/50" />
            </button>
            {onClose && (
              <button onClick={onClose} className="p-0.5 rounded-md hover:bg-muted ml-1">
                <X className="h-3 w-3 text-muted-foreground/50" />
              </button>
            )}
          </div>
        </div>

        {showSettings && (
          <div className="mb-3 p-2 rounded-xl bg-muted/30 animate-fade-in space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-medium text-muted-foreground/70">Focus</span>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={focusMinutes}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value) || 25);
                    setFocusMinutes(val);
                    localStorage.setItem(FOCUS_KEY, String(val));
                  }}
                  className="h-6 w-14 text-[11px] rounded-lg text-center px-1"
                />
                <span className="text-[10px] text-muted-foreground/50">min</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-medium text-muted-foreground/70">Break</span>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={breakMinutes}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value) || 5);
                    setBreakMinutes(val);
                    localStorage.setItem(BREAK_KEY, String(val));
                  }}
                  className="h-6 w-14 text-[11px] rounded-lg text-center px-1"
                />
                <span className="text-[10px] text-muted-foreground/50">min</span>
              </div>
            </div>
            {activeTask && (
              <div className="pt-1 border-t border-border/50">
                <span className="text-[10px] text-muted-foreground/60 block truncate">Focusing on: {activeTask}</span>
              </div>
            )}
          </div>
        )}

        <div className="relative w-36 h-36 mx-auto mb-3">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4"
              className="text-muted/30" />
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              className={cn(
                'transition-all duration-1000 ease-linear',
                mode === 'focus' ? 'text-primary' : 'text-amber-500'
              )}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold tabular-nums tracking-tight">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-muted-foreground/50 mt-0.5">
              {sessions > 0 && `${sessions} session${sessions > 1 ? 's' : ''} today`}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Button
            size="sm"
            className={cn(
              'h-9 w-9 rounded-xl transition-all',
              state === 'running' && 'bg-amber-500 hover:bg-amber-600'
            )}
            onClick={toggleTimer}
          >
            {state === 'running' ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 rounded-xl"
            onClick={resetTimer}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
});
