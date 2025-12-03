import React, { useEffect, useRef, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, "");

export default function ConversationItem({
  convo,
  active,
  onClick,
  onDelete,
  onRename, // (title) => void
  onRegenerateTitle, // () => void
  onAddCourse, // (course) => void
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(convo.title || "New Chat");

  // Context menu (right-click)
  const [menuOpen, setMenuOpen] = useState(false);

  // "+" dropdown state + data
  const [addOpen, setAddOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [coursesError, setCoursesError] = useState(null);
  const hasCourse = Boolean(convo.courseName);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing) {
      setDraft(convo.title || "New Chat");
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing, convo.title]);

  // Close menus on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (!containerRef.current?.contains(e.target)) {
        setMenuOpen(false);
        setAddOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const commit = () => {
    const name = draft.trim() || "New Chat";
    setIsEditing(false);
    if (name !== (convo.title || "New Chat")) onRename && onRename(name);
  };
  const cancel = () => {
    setIsEditing(false);
    setDraft(convo.title || "New Chat");
  };

  // Fetch courses when opening the "+" dropdown
  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      setCoursesError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/courses`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Failed to fetch courses (${res.status})`);
      }
      const data = await res.json();
      setCourses(Array.isArray(data?.courses) ? data.courses : []);
    } catch (err) {
      setCoursesError(err?.message || "Failed to fetch courses");
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };

  const toggleAddMenu = async (e) => {
    e.stopPropagation();
    const next = !addOpen;
    setAddOpen(next);
    if (next) {
      setMenuOpen(false);
      await fetchCourses();
    }
  };

  return (
    <div
      ref={containerRef}
      className={
        "group relative flex items-center justify-between px-3 py-2 rounded-md " +
        (active ? "bg-neutral-200" : "hover:bg-neutral-100")
      }
      title={convo.title || "New Chat"}
      onContextMenu={(e) => {
        e.preventDefault();
        setAddOpen(false);
        setMenuOpen(true);
      }}
    >
      {/* Title area */}
      <button onClick={onClick} className="flex-1 text-left truncate">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commit();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  cancel();
                }
              }}
              className="w-full px-2 py-1 text-sm border rounded outline-none"
            />
            <button
              className="text-xs px-2 py-1 rounded bg-indigo-600 text-white"
              onClick={(e) => {
                e.stopPropagation();
                commit();
              }}
            >
              Save
            </button>
            <button
              className="text-xs px-2 py-1 rounded bg-neutral-200"
              onClick={(e) => {
                e.stopPropagation();
                cancel();
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            {/* Title + Course chip */}
            <div className="text-sm font-medium truncate flex items-center gap-2">
              <span className="truncate">{convo.title || "New Chat"}</span>
              {convo.courseName && (
                <span className="shrink-0 inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 text-[10px]">
                  {convo.courseName}
                </span>
              )}
            </div>

            {/* Timestamp */}
            <div className="text-[11px] text-neutral-500">
              {new Date(convo.updatedAt || Date.now()).toLocaleString()}
            </div>
          </>
        )}
      </button>

      {!isEditing && (
        <div className="ml-2 flex items-center gap-2">
          {/* + Add Course dropdown trigger */}
          <button
            onClick={toggleAddMenu}
            className={
              (hasCourse
                ? "text-emerald-700 hover:text-emerald-900 border-emerald-400 hover:bg-emerald-50"
                : "text-blue-600 hover:text-blue-800 border-blue-400 hover:bg-blue-50") +
              " text-sm px-2 py-0.5 rounded-md border flex items-center gap-1"
            }
            title={hasCourse ? "Change course" : "Add to Course"}
            aria-label={hasCourse ? "Change course" : "Add to Course"}
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {hasCourse ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              )}
            </svg>
            {hasCourse ? "Change course" : "Add to Course"}
          </button>

          {/* Rename icon */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setAddOpen(false);
              setIsEditing(true);
            }}
            className="text-neutral-500 hover:text-neutral-700 text-xs"
            title="Rename"
            aria-label="Rename"
          >
            ✎
          </button>

          {/* Delete icon */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setAddOpen(false);
              onDelete && onDelete();
            }}
            className="text-red-500 hover:text-red-700 text-xs"
            title="Delete"
            aria-label="Delete"
          >
            ✕
          </button>
        </div>
      )}

      {/* + Dropdown menu */}
      {addOpen && !isEditing && (
        <div className="absolute right-2 top-8 z-20 w-56 rounded-md border bg-white shadow-lg">
          <div className="px-3 py-2 border-b text-xs font-semibold text-neutral-600">
            {hasCourse ? "Change course" : "Select a Course"}
            {hasCourse && convo.courseName && (
              <div className="mt-1 text-[11px] font-normal text-neutral-500">
                Current: {convo.courseName}
              </div>
            )}
          </div>

          {loadingCourses && (
            <div className="px-3 py-3 text-sm text-neutral-500">Loading…</div>
          )}

          {coursesError && !loadingCourses && (
            <div className="px-3 py-3 text-sm text-red-600">{coursesError}</div>
          )}

          {!loadingCourses && !coursesError && courses.length === 0 && (
            <div className="px-3 py-3 text-sm text-neutral-500">
              No courses found
            </div>
          )}

          {!loadingCourses && !coursesError && (
            <div className="max-h-64 overflow-auto py-1">
              {/* Create New Course option */}
              <button
                className="w-full text-left px-3 py-2 hover:bg-blue-50 text-blue-600 text-sm border-b flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setAddOpen(false);
                  // Pass special flag to indicate new course creation
                  onAddCourse && onAddCourse({ isNew: true });
                }}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Create New Course
              </button>

              {/* Existing courses */}
              {courses.length > 0 ? (
                courses.map((c) => (
                  <button
                    key={c._id}
                    className="w-full text-left px-3 py-2 hover:bg-neutral-100 text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddOpen(false);
                      onAddCourse && onAddCourse(c);
                    }}
                    title={c.name}
                  >
                    {c.name}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-neutral-500">
                  No existing courses
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Context (right-click) menu */}
      {menuOpen && !isEditing && (
        <div className="absolute right-2 top-8 z-10 w-44 rounded-md border bg-white shadow-lg">
          <button
            className="w-full text-left px-3 py-2 hover:bg-neutral-100 text-sm"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
              setIsEditing(true);
            }}
          >
            Rename
          </button>
          <button
            className="w-full text-left px-3 py-2 hover:bg-neutral-100 text-sm"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
              onRegenerateTitle && onRegenerateTitle();
            }}
          >
            Regenerate title
          </button>
          <div className="h-px bg-neutral-200" />
          <button
            className="w-full text-left px-3 py-2 hover:bg-neutral-100 text-sm text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
              onDelete && onDelete();
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
