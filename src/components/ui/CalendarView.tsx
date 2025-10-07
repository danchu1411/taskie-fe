import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import type { TaskListResponse, TaskRecord } from "../../lib/types";
import { useScheduleData, SCHEDULE_QUERY_KEY } from "../../features/schedule/hooks/useScheduleData";
import { CACHE_CONFIG, PAGINATION } from "../../features/schedule/constants/cacheConfig";
import CalendarTaskModal from "./CalendarTaskModal";

type WorkItemInfo = {
  title: string;
  parentTitle: string | null;
  priority: number | null;
  parentTaskId?: string; // present only for checklist items
};

// Helpers
function startOfMonth(date = new Date()): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfMonth(date = new Date()): Date {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}
function toISOStringUTC(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
}
function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function prettyDate(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}
function priorityDot(priority: number | null | undefined): string {
  if (priority === 1) return 'bg-rose-500';
  if (priority === 2) return 'bg-amber-500';
  if (priority === 3) return 'bg-emerald-500';
  return 'bg-slate-400';
}

function dayTintClass(dateKey: string): string {
  // Deterministic soft colors based on date key
  const palette = [
    'bg-rose-100',
    'bg-amber-100',
    'bg-emerald-100',
    'bg-sky-100',
    'bg-indigo-100',
    'bg-fuchsia-100',
  ];
  let sum = 0;
  for (let i = 0; i < dateKey.length; i++) sum = (sum + dateKey.charCodeAt(i)) % 1000;
  const idx = sum % palette.length;
  return palette[idx];
}

export default function CalendarView({ userId }: { userId: string | null | undefined }) {
  const today = new Date();
  const [cursor, setCursor] = useState<Date>(startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedDateForTask, setSelectedDateForTask] = useState<Date | null>(null);
  const queryClient = useQueryClient();

  const from = useMemo(() => startOfMonth(cursor), [cursor]);
  const to = useMemo(() => endOfMonth(cursor), [cursor]);

  // Fetch schedule entries in current month range using centralized hook
  const { data: entries } = useScheduleData(
    userId,
    { from: toISOStringUTC(from), to: toISOStringUTC(to) },
    { order: 'asc' }
  );

  // Infinite tasks for mapping work_item_id -> title/parent/priority
  const tasksQ = useInfiniteQuery<TaskListResponse>({
    queryKey: ["tasks", userId, "map"],
    enabled: Boolean(userId),
    initialPageParam: PAGINATION.DEFAULT_PAGE,
    getNextPageParam: (lastPage) => {
      const { page, pageSize, total } = lastPage;
      return page * pageSize < total ? page + 1 : undefined;
    },
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      params.append("page", String(pageParam));
      params.append("pageSize", String(PAGINATION.DEFAULT_PAGE_SIZE));
      params.append("includeChecklist", "true");
      params.append("includeWorkItems", "true");
      const res = await api.get<TaskListResponse>(`/tasks/by-user/${userId || "self"}?${params}`);
      return res.data;
    },
    staleTime: CACHE_CONFIG.STALE_TIME,
  });

  // Map work item id to info
  const workItemMap = useMemo(() => {
    const map = new Map<string, WorkItemInfo>();
    const items = tasksQ.data?.pages.flatMap((p) => p.items) ?? [];
    if (!items.length) return map;
    for (const t of items) {
      const taskId = (t as any).id || t.task_id;
      map.set(taskId, { title: t.title, parentTitle: null, priority: t.priority ?? null });
      for (const ci of t.checklist ?? []) {
        map.set(ci.checklist_item_id, { title: ci.title, parentTitle: t.title, priority: ci.priority ?? t.priority ?? null, parentTaskId: taskId });
      }
    }
    return map;
  }, [tasksQ.data?.pages]);

  // Determine which parent task IDs have at least one checklist item scheduled in this range
  const parentIdsWithChildEntries = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries ?? []) {
      const info = workItemMap.get(e.work_item_id ?? '');
      if (info?.parentTaskId) {
        set.add(info.parentTaskId);
      }
    }
    return set;
  }, [entries, workItemMap]);

  // Get all tasks for deadline mapping
  const allTasks = useMemo(() => {
    return tasksQ.data?.pages.flatMap((p) => p.items) ?? [];
  }, [tasksQ.data?.pages]);

  // Group entries by yyyy-mm-dd (scheduled tasks)
  const entriesByDate = useMemo(() => {
    const map = new Map<string, Array<{ title: string; priority: number | null; time: string; duration: number; parent?: string; type: 'scheduled' | 'deadline' }>>();
    
    // Add scheduled entries
    for (const e of entries ?? []) {
      // Hide parent task entries if any child checklist has schedule entries
      if (e.work_item_id && parentIdsWithChildEntries.has(e.work_item_id)) {
        continue;
      }
      const d = new Date(e.start_at);
      const key = fmt(d);
      const info = workItemMap.get(e.work_item_id ?? '');
      const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const list = map.get(key) ?? [];
      const duration = e.planned_minutes ?? e.plannedMinutes ?? 0;
      list.push({ 
        title: info?.title || '(Untitled)', 
        priority: info?.priority ?? null, 
        time, 
        duration, 
        parent: info?.parentTitle ?? undefined,
        type: 'scheduled' as const
      });
      map.set(key, list);
    }

    // Add tasks with deadline but no schedule
    for (const task of allTasks) {
      if (task.deadline && !task.checklist?.length) {
        // Only atomic tasks (no checklist)
        const deadlineDate = new Date(task.deadline);
        const key = fmt(deadlineDate);
        
        // Check if this task is already scheduled anywhere (not just on this date)
        const isAlreadyScheduled = entries?.some(entry => 
          entry.work_item_id === task.id
        );
        
        if (!isAlreadyScheduled) {
          const list = map.get(key) ?? [];
          list.push({
            title: task.title,
            priority: task.priority ?? null,
            time: 'Deadline',
            duration: 0,
            parent: undefined,
            type: 'deadline' as const
          });
          map.set(key, list);
          console.log(`Added deadline task: ${task.title} for date: ${key}`);
        }
      }
    }

    return map;
  }, [entries, workItemMap, parentIdsWithChildEntries, allTasks]);

  // Check if a date has any entries (scheduled or deadline tasks)
  const hasEntries = useCallback((dateKey: string): boolean => {
    const entries = entriesByDate.get(dateKey) ?? [];
    return entries.length > 0;
  }, [entriesByDate]);

  // Build month grid 6x7
  const monthInfo = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const start = new Date(first);
    start.setDate(first.getDate() - ((first.getDay()+7)%7)); // start on Sunday
    const days: Array<{ date: Date; outside: boolean }> = [];
    for (let i=0; i<42; i++) {
      const date = new Date(start);
      date.setDate(start.getDate()+i);
      days.push({ date, outside: date.getMonth()!==month });
    }
    const label = `${first.toLocaleString(undefined,{month:'long'})} ${year}`;
    return { label, days };
  }, [cursor]);

  // Auto load more task pages when reaching sentinel
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!tasksQ.hasNextPage || tasksQ.isFetchingNextPage) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          tasksQ.fetchNextPage();
        }
      });
    });
    io.observe(el);
    return () => io.disconnect();
  }, [tasksQ.hasNextPage, tasksQ.isFetchingNextPage, tasksQ.fetchNextPage]);

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: Partial<TaskRecord>) => {
      const response = await api.post<TaskRecord>("/tasks/create", taskData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
      queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEY });
      setTaskModalOpen(false);
    },
    onError: (error: any) => {
      console.error("Failed to create task:", error);
    },
  });

  // Handlers
  const handleCreateTask = (date: Date) => {
    setSelectedDateForTask(date);
    setTaskModalOpen(true);
  };

  const handleSubmitTask = (taskData: Partial<TaskRecord>) => {
    // Auto-set deadline to selected date
    const taskWithDeadline = {
      ...taskData,
      deadline: selectedDateForTask ? selectedDateForTask.toISOString() : undefined,
    };
    createTaskMutation.mutate(taskWithDeadline);
  };

  const handleCloseTaskModal = () => {
    setTaskModalOpen(false);
    setSelectedDateForTask(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_0_#e6e6e6] p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 md:mb-6 flex items_center justify-between">
        <div>
          <p className="text-xs text-slate-500">Planner</p>
          <div className="flex items-center gap-3 mt-1">
            <button aria-label="Prev month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth()-1, 1))} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white hover:bg-slate-50">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="1.5" d="M15 6l-6 6 6 6"/></svg>
            </button>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight">{monthInfo.label}</h2>
            <button aria-label="Next month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth()+1, 1))} className="inline-flex h-8 w-8 items-center justify_center rounded-md border border-slate-300 bg-white hover:bg-slate-50">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="1.5" d="M9 6l6 6-6 6"/></svg>
            </button>
            <button onClick={() => { const base = new Date(); setCursor(startOfMonth(base)); setSelectedDate(base); }} className="ml-1 hidden sm:inline-flex h-8 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 hover:bg-slate-50">Today</button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-slate-300 bg-white p-1 text-xs">
            <button className="h-8 px-2 rounded-md bg-slate-900 text-white">Month</button>
            <button className="h-8 px-2 rounded-md hover:bg-slate-50 text-slate-700" disabled>Day</button>
          </div>
        </div>
      </div>

      {/* Weekday header */}
      <div className="mt-2 grid grid-cols-7 gap-1 text-[11px] text-slate-500">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((w) => (
          <div key={w} className="text-center py-1">{w}</div>
        ))}
      </div>

      {/* Month grid */}
      <div className="mt-1 grid grid-cols-7 gap-1">
        {monthInfo.days.map(({ date, outside }) => {
          const key = fmt(date);
          const isToday = date.toDateString() === today.toDateString();
          const isSelected = date.toDateString() === selectedDate.toDateString();
          const list = entriesByDate.get(key) ?? [];
          const dots = list.slice(0,3);
        const hasEntriesForDate = hasEntries(key);
        const tint = hasEntriesForDate && !outside ? dayTintClass(key) : '';
          return (
            <button
              key={key}
              onClick={() => setSelectedDate(date)}
              className={[
                "group relative h-24 rounded-lg border text-left p-2 transition",
                outside ? "border-slate-200 bg-slate-50/40 text-slate-400" : `border-slate-200 ${tint || 'bg-white'}`,
                isSelected ? "ring-2 ring-slate-900/60" : "hover:bg-slate-50"
              ].join(" ")}
            >
              {/* Add task button - top right corner (only for today and future dates) */}
              {!outside && (() => {
                const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const currentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                return currentDate >= todayDate;
              })() && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateTask(date);
                  }}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-5 w-5 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 z-10"
                  title="Add task to this day"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
              
              <div className="flex items-center justify-between">
                <span className={["text-xs", isToday? "font-semibold text-slate-900":"text-slate-600"].join(" ")}>{date.getDate()}</span>
                {isToday && <span className="rounded-md bg-slate-900 text-white px-1.5 py-0.5 text-[10px]">Today</span>}
              </div>
              <div className="mt-2 space-y-1">
                {dots.map((t, idx) => (
                  <div key={idx} className="flex items-center gap-1 text-[11px] truncate">
                    <span className={`h-1.5 w-1.5 rounded-full ${priorityDot(t.priority)}`} />
                    <span className="truncate text-slate-700">{t.title}</span>
                  </div>
                ))}
                {list.length > 3 && (
                  <div className="text-[11px] text-slate-500">+{list.length-3} more</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Sentinel for auto-loading next pages of tasks mapping */}
      <div ref={sentinelRef} className="h-6" aria-hidden />

      {/* Side panel for selected date */}
      <div
        className="sticky bottom-6 mt-4 rounded-2xl border border-slate-300 bg-slate-50 px-5 py-5 shadow-md"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            {prettyDate(selectedDate)}
          </h3>
        </div>
        <div className="mt-3 space-y-2">
          {(entriesByDate.get(fmt(selectedDate)) ?? [])
            .slice()
            .sort((a,b) => {
              // Sort scheduled tasks by time, deadline tasks at the end
              if (a.type === 'scheduled' && b.type === 'deadline') return -1;
              if (a.type === 'deadline' && b.type === 'scheduled') return 1;
              if (a.type === 'scheduled' && b.type === 'scheduled') return a.time.localeCompare(b.time);
              return 0;
            })
            .map((t, i) => (
              <div key={i} className={`flex items-center justify-between rounded-xl border p-3 ${
                t.type === 'deadline' 
                  ? 'border-amber-200 bg-amber-50' 
                  : 'border-slate-200 bg-white'
              }`}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`h-2.5 w-2.5 rounded-full ${priorityDot(t.priority)}`}/>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate text-slate-900">{t.title}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-3">
                      <span className={t.type === 'deadline' ? 'text-amber-600 font-medium' : ''}>
                        {t.type === 'deadline' ? '📅 Deadline' : t.time}
                      </span>
                      {t.type === 'scheduled' && <span>{t.duration}m</span>}
                      {t.parent && <span className="inline-flex items-center gap-1"><svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="1.5" d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>{t.parent}</span>}
                    </div>
                  </div>
                </div>
                {t.type === 'scheduled' && (
                  <button className="inline-flex h-8 items-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 hover:bg-slate-50">Start Focus</button>
                )}
                {t.type === 'deadline' && (
                  <button className="inline-flex h-8 items-center rounded-lg border border-amber-300 bg-amber-100 px-3 text-xs font-medium text-amber-800 hover:bg-amber-200">Schedule</button>
                )}
              </div>
            ))}
          {(entriesByDate.get(fmt(selectedDate)) ?? []).length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-sm text-slate-600">
              No entries for this day.
            </div>
          )}
        </div>
      </div>

      {/* Calendar Task Modal */}
      <CalendarTaskModal
        isOpen={taskModalOpen}
        onClose={handleCloseTaskModal}
        onSubmit={handleSubmitTask}
        selectedDate={selectedDateForTask}
        isLoading={createTaskMutation.isPending}
      />
    </div>
  );
}
