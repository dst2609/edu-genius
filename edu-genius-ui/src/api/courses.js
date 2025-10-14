import { http } from "./client";

const normalize = (c = {}) => ({
  _id: c._id ?? c.id,
  name: c.name,
  percent: typeof c.percent === "number" ? c.percent : Number(c.percent) || 0,
});

export async function listCourses() {
  const { data } = await http.get("/courses");
  const raw = Array.isArray(data) ? data : data?.courses || [];
  return raw.map(normalize);
}

export async function createCourse(payload) {
  await http.post("/courses", payload);
}

export async function updateCourse(id, payload) {
  await http.put(`/courses/${encodeURIComponent(id)}`, payload);
}

export async function deleteCourse(id) {
  await http.delete(`/courses/${encodeURIComponent(id)}`);
}
