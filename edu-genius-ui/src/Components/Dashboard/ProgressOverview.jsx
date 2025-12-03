import React, { useEffect, useMemo, useState } from "react";
import { API_BASE, authHeaders } from "../../api/client";

const cardClass =
  "rounded-xl border bg-white shadow-sm p-4 flex flex-col gap-2 transition-transform duration-200 hover:-translate-y-[2px]";

const badge = (delta) => {
  if (delta === null || typeof delta === "undefined") return null;
  const up = delta >= 0;
  return (
    <span
      className={
        "ml-2 inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-medium " +
        (up
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-rose-50 text-rose-700 border border-rose-200")
      }
    >
      {up ? "▲" : "▼"} {Math.abs(delta)}%
    </span>
  );
};

const progressColor = (pct) => {
  if (pct < 30) return "bg-rose-500";
  if (pct < 70) return "bg-amber-500";
  return "bg-emerald-600";
};

export default function ProgressOverview({ user }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [courses, setCourses] = useState([]);
  const [goals, setGoals] = useState(() => {
    const stored = localStorage.getItem("weeklyGoals");
    return (
      JSON.parse(stored || "null") || {
        messages: 20,
      }
    );
  });

  useEffect(() => {
    localStorage.setItem("weeklyGoals", JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [aRes, cRes] = await Promise.all([
          fetch(`${API_BASE}/chat/analytics`, { headers: authHeaders() }),
          fetch(`${API_BASE}/courses`, { headers: authHeaders() }),
        ]);

        if (aRes.status === 401 || cRes.status === 401) {
          throw Object.assign(new Error("Unauthorized"), { status: 401 });
        }

        const analyticsData = aRes.ok ? await aRes.json() : null;
        const courseData = cRes.ok ? await cRes.json() : { courses: [] };

        setAnalytics(analyticsData);
        setCourses(Array.isArray(courseData?.courses) ? courseData.courses : []);
        setLoading(false);
      } catch (e) {
        if (e?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          setError("Your session expired. Please log in again.");
        } else {
          setError("Progress data is unavailable right now. Please try again.");
        }
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const velocity = useMemo(() => {
    const perDay = analytics?.volume?.perDay || [];
    const weeklyMessages = perDay.reduce((sum, d) => sum + (d.count || 0), 0);
    const lastWeekMessages =
      perDay.slice(0, -1).reduce((sum, d) => sum + (d.count || 0), 0) || 0;
    const msgDelta =
      lastWeekMessages === 0
        ? weeklyMessages > 0
          ? 100
          : null
        : Math.round(((weeklyMessages - lastWeekMessages) / lastWeekMessages) * 100);

    return {
      messages: weeklyMessages,
      msgDelta,
    };
  }, [analytics]);

  const streaks = useMemo(() => {
    const perDay = analytics?.volume?.perDay || [];
    let current = 0;
    let longest = 0;
    for (let i = perDay.length - 1; i >= 0; i -= 1) {
      if ((perDay[i]?.count || 0) > 0) current += 1;
      else break;
    }
    for (let i = perDay.length - 1; i >= 0; i -= 1) {
      if ((perDay[i]?.count || 0) > 0) longest = Math.max(longest, current);
    }
    longest = Math.max(longest, current);
    return { current, longest };
  }, [analytics]);

  const courseProgress = courses.map((c) => ({
    id: c._id,
    name: c.name,
    percent: Number.isFinite(c.percent) ? c.percent : 0,
  }));

  return (
    <div
      className="progress-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "16px",
        marginTop: "12px",
      }}
    >
      <SectionHeader title="Progress" subtitle="Track your learning momentum" />

      {loading ? (
        <div className="progress-placeholder">Loading progress…</div>
      ) : error ? (
        <div className="progress-placeholder text-red-600">{error}</div>
      ) : (
        <>
          {/* Course completion */}
          <div className={cardClass}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  Course completion
                </div>
                <div className="text-xs text-gray-500">
                  Linked courses with reported completion
                </div>
              </div>
            </div>
            {courseProgress.length === 0 ? (
              <div className="text-sm text-gray-500">
                Connect courses to see completion progress.
              </div>
            ) : (
              <div className="space-y-2">
                {courseProgress.map((c) => (
                  <div key={c.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-800">
                        {c.name}
                      </span>
                      <span className="text-xs text-gray-600">{c.percent}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full ${progressColor(c.percent)}`}
                        style={{ width: `${Math.min(100, Math.max(0, c.percent))}%` }}
                        aria-label={`${c.name} completion ${c.percent}%`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weekly velocity */}
          <div className={cardClass}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  Weekly learning velocity
                </div>
                <div className="text-xs text-gray-500">vs last week</div>
              </div>
              {badge(velocity.msgDelta)}
            </div>
            <div className="grid grid-cols-1 gap-2 text-center">
              <VelocityPill label="Messages" value={velocity.messages} />
            </div>
          </div>

          {/* Streaks */}
          <div className={cardClass}>
            <div className="text-sm font-semibold text-gray-900">Streaks</div>
            <div className="flex items-center gap-6">
              <StreakStat label="Current streak" value={`${streaks.current} days`} />
              <StreakStat label="Longest streak" value={`${streaks.longest} days`} />
            </div>
            <div className="text-xs text-gray-500">
              Keep the streak alive with one message per day.
            </div>
          </div>

          {/* Goals */}
          <div className={cardClass}>
            <div className="text-sm font-semibold text-gray-900">Weekly goals</div>
            <div className="space-y-3">
              <GoalRow
                label="Messages"
                value={velocity.messages}
                goal={goals.messages}
                onGoalChange={(v) => setGoals((g) => ({ ...g, messages: v }))}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div>
        <div className="text-sm font-semibold text-gray-900">{title}</div>
        <div className="text-xs text-gray-500">{subtitle}</div>
      </div>
    </div>
  );
}

function VelocityPill({ label, value }) {
  return (
    <div className="rounded-lg border bg-gray-50 py-3 px-2">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function StreakStat({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-lg font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function GoalRow({ label, value, goal, onGoalChange }) {
  const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-800">{label}</span>
        <span className="text-xs text-gray-600">
          {value}/{goal} this week
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full bg-indigo-600"
          style={{ width: `${pct}%` }}
          aria-label={`${label} progress ${pct}%`}
        />
      </div>
      <div className="flex items-center gap-2 text-[11px] text-gray-600">
        Set goal:
        <input
          type="number"
          min="0"
          value={goal}
          onChange={(e) => onGoalChange(Number(e.target.value) || 0)}
          className="w-16 rounded border px-2 py-1 text-xs"
        />
      </div>
    </div>
  );
}
