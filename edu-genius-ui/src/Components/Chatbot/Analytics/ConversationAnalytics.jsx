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
  onExportPdf,
  onShare,
  exportBusyId,
}) {
  const volumeSeries = analytics?.volume?.perDay || [];
  const maxVolume = Math.max(...volumeSeries.map((d) => d.count || 0), 1);
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <StatCard
              label="Chat volume (7d)"
              value={analytics.volume?.total ?? 0}
              helper={analytics.courseName || "All courses"}
            />
            <StatCard
              label="Avg. response latency"
              value={
                analytics.latency?.avgMs
                  ? `${Math.round(analytics.latency.avgMs)} ms`
                  : "—"
              }
              helper="Bot reply time"
            />
            <StatCard
              label="Satisfaction"
              value={`${analytics.satisfaction?.rate ?? 0}%`}
              helper={`${analytics.satisfaction?.likes ?? 0} 👍 · ${
                analytics.satisfaction?.dislikes ?? 0
              } 👎`}
            />
          </div>

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
                <div className="flex items-end gap-2 h-36">
                  {volumeSeries.map((d, idx) => (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <div
                        className="w-full bg-indigo-100 rounded-t"
                        style={{
                          height: `${Math.max(
                            10,
                            Math.round((d.count / maxVolume) * 100)
                          )}%`,
                        }}
                        title={`${d.count} messages`}
                      >
                        <div className="w-full h-full bg-indigo-500 rounded-t opacity-80" />
                      </div>
                      <div className="text-[10px] text-gray-500 text-center">
                        {d.label}
                      </div>
                      <div className="text-[11px] text-gray-800 font-medium">
                        {d.count}
                      </div>
                    </div>
                  ))}
                </div>
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
                          <div className="flex justify-end gap-2">
                            <ActionButton
                              onClick={() => onExportCsv?.(c.id)}
                              busy={exportBusyId === c.id}
                              label="CSV"
                            />
                            <ActionButton
                              onClick={() => onExportPdf?.(c.id)}
                              busy={exportBusyId === c.id}
                              label="PDF"
                            />
                            <button
                              onClick={() => onShare?.(c.id, c.shareUrl)}
                              className="text-[11px] px-3 py-1 rounded-md border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                              title="Copy share link"
                            >
                              Share
                            </button>
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

function StatCard({ label, value, helper }) {
  return (
    <div className="rounded-lg border bg-white shadow-sm p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-semibold text-gray-900 mt-1">{value}</div>
      {helper && <div className="text-[11px] text-gray-500 mt-1">{helper}</div>}
    </div>
  );
}

function ActionButton({ onClick, busy, label }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="text-[11px] px-3 py-1 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {busy ? "Working…" : label}
    </button>
  );
}
