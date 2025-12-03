import React from "react";
import Spinner from "../Spinner/Spinner.jsx";

export default function ConversationAnalytics({
  loading,
  error,
  analytics,
  onRefresh,
  courseId,
  courses = [],
  coursesLoading = false,
  onCourseChange,
  onExportCsv,
  exportBusyId,
}) {
  const volumeSeries = analytics?.volume?.perDay || [];
  const courseOptions = [
    { _id: "all", name: "All courses" },
    ...courses.map((c) => ({ _id: c._id, name: c.name })),
  ];

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="px-4 sm:px-6 md:px-8 py-4 border-b flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">
            Conversation Analytics
          </div>
          <div className="text-xs text-gray-500">
            Per-course chat volume, response latency, and satisfaction.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={courseId}
            onChange={(e) => onCourseChange?.(e.target.value)}
            className="text-xs border rounded-md px-3 py-2 bg-white"
            aria-label="Filter by course"
          >
            {courseOptions.map((c) => (
              <option key={c._id || c.id} value={c._id || c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={onRefresh}
            className="text-xs px-3 py-2 rounded-md border bg-white hover:bg-gray-100"
            aria-label="Refresh analytics"
          >
            Reload
          </button>
        </div>
      </div>

      {coursesLoading && (
        <div className="px-4 py-2 text-xs text-gray-500">
          Loading courses…
        </div>
      )}

      {error && (
        <div className="px-4 py-3 text-xs text-amber-800 bg-amber-50 border-b border-amber-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
          <Spinner className="mr-2 text-gray-500" /> Loading analytics…
        </div>
      ) : analytics ? (
        <div className="p-4 sm:p-6 space-y-4">
          <div className="rounded-lg border bg-white shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  Chat volume (last 7 days)
                </div>
                <div className="text-xs text-gray-500">
                  Recent interactions for this course filter.
                </div>
              </div>
            </div>
            <div className="px-4 py-3">
              {volumeSeries.length === 0 ? (
                <div className="text-sm text-gray-500">
                  No messages yet for this course.
                </div>
              ) : (
                <ColumnChart data={volumeSeries} height={220} />
              )}
            </div>
          </div>

          <div className="rounded-lg border bg-white shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  Transcript exports & sharing
                </div>
                <div className="text-xs text-gray-500">
                  Export PDF/CSV or copy a share link for a conversation.
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs text-gray-500">
                    <th className="px-4 py-2">Conversation</th>
                    <th className="px-4 py-2">Last updated</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(analytics.conversations || []).length === 0 ? (
                    <tr>
                      <td
                        className="px-4 py-3 text-gray-500 text-sm"
                        colSpan={3}
                      >
                        No conversations found for this course filter.
                      </td>
                    </tr>
                  ) : (
                    (analytics.conversations || []).map((c) => (
                      <tr key={c.id} className="border-b last:border-0">
                        <td className="px-4 py-2 text-gray-900">
                          {c.title || "Conversation"}
                        </td>
                        <td className="px-4 py-2 text-gray-500">
                          {c.updatedAt
                            ? new Date(c.updatedAt).toLocaleString()
                            : "—"}
                        </td>
                    <td className="px-4 py-2">
                          <div className="flex justify-end">
                            <ActionButton
                              onClick={() => onExportCsv?.(c.id)}
                              busy={exportBusyId === c.id}
                              label="Export CSV"
                              variant="primary"
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 text-sm text-gray-500">No analytics available.</div>
      )}
    </div>
  );
}

function ActionButton({ onClick, busy, label, variant = "ghost" }) {
  const base =
    "text-[11px] px-3 py-1.5 rounded-md border text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "border-indigo-500 bg-indigo-600 text-white hover:bg-indigo-700"
      : "border-gray-200 text-gray-700 hover:bg-gray-100";
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`${base} ${styles}`}
    >
      {busy ? "Working…" : label}
    </button>
  );
}

function ColumnChart({ data, height = 220 }) {
  const padded = data.map((d) => ({
    label: d.label,
    value: Number.isFinite(d.count) ? d.count : 0,
  }));
  const maxVal = Math.max(...padded.map((d) => d.value), 1);
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) =>
    Math.round(maxVal * t)
  );

  return (
    <div className="w-full">
      <div className="relative">
        <svg
          role="img"
          aria-label="Chat volume over time"
          width="100%"
          height={height}
          viewBox={`0 0 ${Math.max(240, padded.length * 40)} ${height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Axes */}
          <line
            x1="40"
            y1={height - 30}
            x2={Math.max(200, padded.length * 40)}
            y2={height - 30}
            stroke="#d1d5db"
            strokeWidth="1"
          />
          <line
            x1="40"
            y1="10"
            x2="40"
            y2={height - 30}
            stroke="#d1d5db"
            strokeWidth="1"
          />

          {/* Y ticks */}
          {yTicks.map((tick, idx) => {
            const y =
              10 + (1 - tick / maxVal) * (height - 40);
            return (
              <g key={`tick-${idx}-${tick}`}>
                <line
                  x1="36"
                  x2="40"
                  y1={y}
                  y2={y}
                  stroke="#d1d5db"
                  strokeWidth="1"
                />
                <text
                  x="30"
                  y={y + 4}
                  fontSize="9"
                  fill="#6b7280"
                  textAnchor="end"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {padded.map((point, idx) => {
            const barWidth = 20;
            const gap = 16;
            const x = 60 + idx * (barWidth + gap);
            const barHeight = Math.max(
              4,
              (point.value / maxVal) * (height - 40)
            );
            const y = height - 30 - barHeight;
            const valueY = Math.max(14, y - 8); // prevent value text from clipping above the chart

            return (
              <g key={point.label}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx="4"
                  fill="#6366f1"
                  opacity="0.85"
                />
                <text
                  x={x + barWidth / 2}
                  y={height - 14}
                  fontSize="9"
                  fill="#6b7280"
                  textAnchor="middle"
                >
                  {point.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
