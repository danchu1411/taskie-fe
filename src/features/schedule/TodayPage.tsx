import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";

type StatusValue = 0 | 1 | 2 | 3;

const STATUS: Record<"PLANNED" | "IN_PROGRESS" | "DONE" | "SKIPPED", StatusValue> = {
  PLANNED: 0,
  IN_PROGRESS: 1,
  DONE: 2,
  SKIPPED: 3,
};

const STATUS_FLOW: StatusValue[] = [STATUS.PLANNED, STATUS.IN_PROGRESS, STATUS.DONE, STATUS.SKIPPED];

function statusLabel(value: StatusValue) {
  if (value === STATUS.IN_PROGRESS) return "In progress";
  if (value === STATUS.DONE) return "Done";
  if (value === STATUS.SKIPPED) return "Skipped";
  return "Planned";
}

function statusClasses(value: StatusValue) {
  if (value === STATUS.IN_PROGRESS) return "bg-amber-100 text-amber-800 border-amber-200";
  if (value === STATUS.DONE) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (value === STATUS.SKIPPED) return "bg-slate-100 text-slate-600 border-slate-200";
  return "bg-sky-100 text-sky-700 border-sky-200";
}

function pickNextStatus(value: StatusValue): StatusValue {
  const idx = STATUS_FLOW.indexOf(value);
  return STATUS_FLOW[(idx + 1) % STATUS_FLOW.length];
}

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type WorkItem = {
  id: string;
  title: string;
  taskId: string;
  parentTitle?: string | null;
  isAtomic: boolean;
  effectiveDeadline?: string | null;
  effectivePriority?: 1 | 2 | 3 | null;
  est?: number;
  status: StatusValue;
  startAt?: string | null;
  updatedAt?: number;
};

type Mode = "focus" | "break";

type StatusChipProps = {
  status: StatusValue;
  onChange: (value: StatusValue) => void;
};

function StatusChip({ status, onChange }: StatusChipProps) {
  return (
    <button
      type="button"
      className={clsx(
        "inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-medium transition hover:brightness-[0.97]",
        statusClasses(status),
      )}
      onClick={(event) => {
        event.stopPropagation();
        onChange(pickNextStatus(status));
      }}
    >
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
      {statusLabel(status)}
    </button>
  );
}

type RingProps = {
  value: number;
};

function Ring({ value }: RingProps) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const bounded = Math.max(0, Math.min(100, value));
  const offset = circumference - (bounded / 100) * circumference;
  return (
    <svg viewBox="0 0 100 100" className="h-24 w-24">
      <circle cx="50" cy="50" r={radius} className="fill-none stroke-slate-200" strokeWidth={10} />
      <circle
        cx="50"
        cy="50"
        r={radius}
        className="fill-none stroke-indigo-500 transition-[stroke-dashoffset]"
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const ss = String(totalSeconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

type TodayPageProps = {
  onNavigate?: (path: string) => void;
};

export default function TodayPage({ onNavigate }: TodayPageProps) {
  const { user, logout } = useAuth();
  const [activeNav, setActiveNav] = useState<"today" | "tasks" | "planner" | "stats">("today");
  const [items, setItems] = useState<WorkItem[]>([
    {
      id: "w1",
      title: "Finish Algebra practice set",
      taskId: "t1",
      isAtomic: true,
      parentTitle: null,
      effectiveDeadline: "Today 16:00",
      effectivePriority: 1,
      est: 25,
      status: STATUS.IN_PROGRESS,
      startAt: "09:30",
      updatedAt: Date.now() - 1_000,
    },
    {
      id: "w2",
      title: "Read Ch.3: Photosynthesis",
      taskId: "t2",
      isAtomic: true,
      parentTitle: null,
      effectiveDeadline: "Today 18:00",
      effectivePriority: 2,
      est: 30,
      status: STATUS.PLANNED,
      startAt: "13:00",
      updatedAt: Date.now() - 2_000,
    },
    {
      id: "w3",
      title: "Flashcards – Spanish verbs",
      taskId: "t3",
      isAtomic: false,
      parentTitle: "Spanish weekly prep",
      effectiveDeadline: "Today",
      effectivePriority: 3,
      est: 15,
      status: STATUS.PLANNED,
      startAt: null,
      updatedAt: Date.now() - 3_000,
    },
    {
      id: "w4",
      title: "Essay outline: Industrial Rev.",
      taskId: "t4",
      isAtomic: true,
      parentTitle: null,
      effectiveDeadline: "Tomorrow",
      effectivePriority: 2,
      est: 20,
      status: STATUS.PLANNED,
      startAt: "20:00",
      updatedAt: Date.now() - 4_000,
    },
    {
      id: "w5",
      title: "Chemistry – balance equations (quiz)",
      taskId: "t5",
      isAtomic: true,
      parentTitle: null,
      effectiveDeadline: "Today",
      effectivePriority: 2,
      est: 20,
      status: STATUS.DONE,
      startAt: "08:00",
      updatedAt: Date.now() - 60_000,
    },
    {
      id: "w6",
      title: "Vocabulary deck – 10 words",
      taskId: "t6",
      isAtomic: false,
      parentTitle: "English practice",
      effectiveDeadline: "Today",
      effectivePriority: 3,
      est: 10,
      status: STATUS.SKIPPED,
      startAt: null,
      updatedAt: Date.now() - 70_000,
    },
  ]);

  const [quickOpen, setQuickOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const quickRef = useRef<HTMLInputElement | null>(null);

  const [timerOpen, setTimerOpen] = useState(false);
  const [timerMode, setTimerMode] = useState<Mode>("focus");
  const [timerDuration, setTimerDuration] = useState(25 * 60 * 1000);
  const [timerRemain, setTimerRemain] = useState(timerDuration);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerItemId, setTimerItemId] = useState<string | null>(null);

  useEffect(() => {
    setTimerRemain(timerDuration);
  }, [timerDuration]);

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setTimerRemain((prev) => {
        if (prev <= 1_000) {
          window.clearInterval(id);
          setTimerRunning(false);
          const nextMode: Mode = timerMode === "focus" ? "break" : "focus";
          const nextDuration = nextMode === "focus" ? 25 * 60 * 1000 : 5 * 60 * 1000;
          setTimerMode(nextMode);
          setTimerDuration(nextDuration);
          return nextDuration;
        }
        return prev - 1_000;
      });
    }, 1_000);
    return () => window.clearInterval(id);
  }, [timerRunning, timerMode]);

  const inProgress = useMemo(
    () =>
      items
        .filter((item) => item.status === STATUS.IN_PROGRESS)
        .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)),
    [items],
  );

  const planned = useMemo(
    () =>
      items
        .filter((item) => item.status === STATUS.PLANNED)
        .sort((a, b) => {
          if (a.startAt && b.startAt) return a.startAt.localeCompare(b.startAt);
          if (a.startAt) return -1;
          if (b.startAt) return 1;
          return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
        }),
    [items],
  );

  const completed = useMemo(
    () => items.filter((item) => item.status === STATUS.DONE || item.status === STATUS.SKIPPED),
    [items],
  );

  const [showCompleted, setShowCompleted] = useState(false);
  const [expandPlanned, setExpandPlanned] = useState(false);

  const plannedDisplay = expandPlanned ? planned : planned.slice(0, 5);

  const doneCount = completed.filter((item) => item.status === STATUS.DONE).length;
  const progressValue = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  const addQuickItem = useCallback(
    (title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      setItems((prev) => [
        {
          id: `${Date.now()}`,
          title: trimmed,
          taskId: `task-${Date.now()}`,
          isAtomic: true,
          parentTitle: null,
          effectiveDeadline: "Today",
          effectivePriority: 2,
          est: 25,
          status: STATUS.PLANNED,
          startAt: null,
          updatedAt: Date.now(),
        },
        ...prev,
      ]);
      setQuickTitle("");
      window.setTimeout(() => quickRef.current?.focus(), 0);
    },
    [],
  );

  const openTimer = useCallback(
    (itemId: string, minutes: number) => {
      const duration = minutes * 60 * 1000;
      setTimerMode("focus");
      setTimerDuration(duration);
      setTimerRemain(duration);
      setTimerRunning(false);
      setTimerItemId(itemId);
      setTimerOpen(true);
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, status: STATUS.IN_PROGRESS, updatedAt: Date.now() } : item)),
      );
    },
    [],
  );

  const updateStatus = useCallback((id: string, status: StatusValue) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status, updatedAt: Date.now() } : item)));
  }, []);

  const navButton = (key: typeof activeNav, label: string) => {
    const isActive = activeNav === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => setActiveNav(key)}
        className={clsx(
          "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
          isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900",
        )}
        aria-current={isActive ? "page" : undefined}
      >
        <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <button
            type="button"
            onClick={() => (onNavigate ? onNavigate("/") : undefined)}
            className="text-xl font-semibold tracking-tight text-indigo-600"
          >
            Taskie
          </button>
          <div className="hidden items-center gap-3 sm:flex">
            {navButton("today", "Today")}
            {navButton("tasks", "Tasks")}
            {navButton("planner", "Planner")}
            {navButton("stats", "Stats")}
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>{user?.name ?? user?.email ?? "Guest"}</span>
            <button
              type="button"
              onClick={() => logout().catch(() => undefined)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-32">
        <section className="flex flex-col gap-4 py-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Hi, {user?.name ?? "there"} 👋</h1>
            <p className="mt-1 text-sm text-slate-600">Minimal focus — work one thing at a time.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTimerOpen(true)}
              className="inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Start focus
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.32em] text-indigo-600">Today</p>
              <h2 className="text-xl font-semibold text-slate-900">Progress overview</h2>
              <p className="text-sm text-slate-500">{doneCount}/{items.length} completed</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-semibold text-slate-900">{progressValue}%</div>
                <p className="text-xs uppercase tracking-wide text-slate-500">complete</p>
              </div>
              <Ring value={progressValue} />
            </div>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-slate-900 transition-all"
              style={{ width: `${progressValue}%` }}
            />
          </div>
        </section>

        <section className="mt-8 space-y-6">
          <article className="space-y-3 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <header className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">In progress</h3>
                <p className="text-sm text-slate-500">Pinned at the top</p>
              </div>
              <span className="text-sm text-slate-500">{inProgress.length}</span>
            </header>
            {inProgress.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                Nothing in progress yet. Pick a task from the list below.
              </p>
            ) : (
              <ul className="space-y-3">
                {inProgress.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                  >
                    <div className="flex flex-1 items-start gap-3 pr-4">
                      <StatusChip status={item.status} onChange={(value) => updateStatus(item.id, value)} />
                      <div>
                        <p className="font-medium text-slate-900">{item.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
                          {item.parentTitle && <span className="rounded-md bg-slate-100 px-2 py-0.5">From: {item.parentTitle}</span>}
                          {item.est ? <span>Est. {item.est}m</span> : null}
                          {item.effectiveDeadline && <span>{item.effectiveDeadline}</span>}
                          {item.startAt && <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-indigo-700">{item.startAt}</span>}
                          {item.effectivePriority && (
                            <span
                              className={clsx(
                                "rounded-md border px-2 py-0.5",
                                item.effectivePriority === 1
                                  ? "border-rose-200 bg-rose-50 text-rose-600"
                                  : item.effectivePriority === 2
                                  ? "border-amber-200 bg-amber-50 text-amber-600"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-600",
                              )}
                            >
                              {item.effectivePriority === 1 ? "High" : item.effectivePriority === 2 ? "Medium" : "Low"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openTimer(item.id, item.est ?? 25)}
                      className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-900 px-4 text-xs font-medium text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                    >
                      Resume focus
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="space-y-3 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <header className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Planned for today</h3>
                <p className="text-sm text-slate-500">Pick one to get started</p>
              </div>
              <span className="text-sm text-slate-500">{planned.length}</span>
            </header>
            <ul className="space-y-3">
              {plannedDisplay.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                >
                  <div className="flex flex-1 items-start gap-3 pr-4">
                    <StatusChip status={item.status} onChange={(value) => updateStatus(item.id, value)} />
                    <div>
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
                        {item.parentTitle && <span className="rounded-md bg-slate-100 px-2 py-0.5">From: {item.parentTitle}</span>}
                        {item.est ? <span>Est. {item.est}m</span> : null}
                        {item.effectiveDeadline && <span>{item.effectiveDeadline}</span>}
                        {item.startAt ? (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5">{item.startAt}</span>
                        ) : (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5">Unscheduled</span>
                        )}
                        {item.effectivePriority && (
                          <span
                            className={clsx(
                              "rounded-md border px-2 py-0.5",
                              item.effectivePriority === 1
                                ? "border-rose-200 bg-rose-50 text-rose-600"
                                : item.effectivePriority === 2
                                ? "border-amber-200 bg-amber-50 text-amber-600"
                                : "border-emerald-200 bg-emerald-50 text-emerald-600",
                            )}
                          >
                            {item.effectivePriority === 1 ? "High" : item.effectivePriority === 2 ? "Medium" : "Low"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openTimer(item.id, item.est ?? 25)}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 px-4 text-xs font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-700"
                  >
                    Start focus
                  </button>
                </li>
              ))}
            </ul>
            {planned.length > plannedDisplay.length && (
              <button
                type="button"
                onClick={() => setExpandPlanned(true)}
                className="text-sm font-medium text-indigo-600 hover:underline"
              >
                Show more tasks
              </button>
            )}
            {expandPlanned && planned.length > 5 && (
              <button
                type="button"
                onClick={() => setExpandPlanned(false)}
                className="text-sm font-medium text-slate-600 hover:underline"
              >
                Show fewer
              </button>
            )}
          </article>

          <article className="space-y-3 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <header className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Completed today</h3>
                <p className="text-sm text-slate-500">Done or skipped</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">{completed.length}</span>
                <button
                  type="button"
                  onClick={() => setShowCompleted((prev) => !prev)}
                  className="text-sm font-medium text-slate-600 hover:underline"
                >
                  {showCompleted ? "Hide" : "Show"}
                </button>
              </div>
            </header>
            {showCompleted && (
              <ul className="space-y-3">
                {completed.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                  >
                    <div className="flex flex-1 items-start gap-3 pr-4">
                      <StatusChip status={item.status} onChange={(value) => updateStatus(item.id, value)} />
                      <div>
                        <p className="font-medium text-slate-900">{item.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
                          {item.parentTitle && <span className="rounded-md bg-slate-100 px-2 py-0.5">From: {item.parentTitle}</span>}
                          {item.est ? <span>Est. {item.est}m</span> : null}
                          {item.effectiveDeadline && <span>{item.effectiveDeadline}</span>}
                          {item.startAt && <span className="rounded-md bg-slate-100 px-2 py-0.5">{item.startAt}</span>}
                          <span
                            className={clsx(
                              "rounded-md border px-2 py-0.5",
                              item.status === STATUS.DONE
                                ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                                : "border-slate-200 bg-slate-100 text-slate-600",
                            )}
                          >
                            {item.status === STATUS.DONE ? "Done" : "Skipped"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateStatus(item.id, STATUS.PLANNED)}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 px-4 text-xs font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-700"
                    >
                      Move back
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>
      </main>

      <div className="fixed bottom-6 right-6 z-40">
        {quickOpen && (
          <div className="mb-3 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
            <p className="mb-2 text-sm font-medium text-slate-700">Quick add</p>
            <div className="flex items-center gap-3">
              <input
                ref={quickRef}
                value={quickTitle}
                onChange={(event) => setQuickTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addQuickItem(quickTitle);
                  }
                }}
                placeholder="Task title..."
                className="h-11 flex-1 rounded-xl border border-slate-200 px-3 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
              />
              <button
                type="button"
                onClick={() => addQuickItem(quickTitle)}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Add
              </button>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            setQuickOpen((prev) => !prev);
            window.setTimeout(() => {
              if (!quickOpen) quickRef.current?.focus();
            }, 40);
          }}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-600"
        >
          <span className="text-2xl leading-none">+</span>
        </button>
      </div>

      {timerOpen && (
        <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border border-slate-200 bg-white/95 shadow-2xl">
          <div className="mx-auto max-w-3xl px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.32em] text-indigo-600">Focus timer</p>
                <h4 className="text-lg font-semibold text-slate-900">Pomodoro</h4>
              </div>
              <button
                type="button"
                onClick={() => setTimerOpen(false)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Close
              </button>
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 sm:items-center">
              <div className="flex items-center justify-center">
                <div className="relative">
                  <Ring value={100 - (timerRemain / timerDuration) * 100} />
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="text-center">
                      <p className="text-3xl font-semibold text-slate-900">{formatTime(timerRemain)}</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                        {timerMode === "focus" ? "Focus" : "Break"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  {timerItemId
                    ? `Focusing: ${items.find((item) => item.id === timerItemId)?.title ?? ""}`
                    : "Pick a task to start the timer."}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setTimerRunning((prev) => !prev)}
                    className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-slate-900 px-4 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                  >
                    {timerRunning ? "Pause" : "Start"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTimerRunning(false);
                      setTimerRemain(timerDuration);
                    }}
                    className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-700"
                  >
                    Reset
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[{ label: "25m", value: 25 }, { label: "45m", value: 45 }, { label: "5m", value: 5 }].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        const duration = preset.value * 60 * 1000;
                        setTimerMode(preset.value === 5 ? "break" : "focus");
                        setTimerDuration(duration);
                        setTimerRemain(duration);
                        setTimerRunning(false);
                      }}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

