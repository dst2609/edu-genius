const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const toLegacy = (c) => {
  if (!c) return c;
  const { id, ...rest } = c;
  return { _id: id, ...rest };
};

const normalizeCoursePayload = (body = {}) => {
  const name = (body.name ?? '').trim();
  const percentRaw = body.percent;
  const percent = percentRaw === undefined || percentRaw === null
    ? undefined
    : Number.isNaN(Number(percentRaw)) ? undefined : Number(percentRaw);
  return { name, percent };
};

exports.listCourses = async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      where: { userId: String(req.user) }, // ensure string
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ courses: courses.map(toLegacy) });
  } catch (e) {
    console.error('listCourses error:', e);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { name, percent } = normalizeCoursePayload(req.body);

    if (!name) return res.status(400).json({ error: 'Name is required' });

    const course = await prisma.course.create({
      data: {
        userId: String(req.user),
        name,
        percent: percent ?? 0,
      },
    });
    res.status(201).json({ course: toLegacy(course) });
  } catch (e) {
    console.error('createCourse error:', e);
    res.status(500).json({ error: 'Failed to create course' });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const id = req.params.id || req.params._id || req.body.id || req.body._id;
    if (!id || !/^[0-9a-fA-F]{24}$/.test(String(id))) {
      return res.status(400).json({ error: 'Invalid course id' });
    }

    const { name, percent } = normalizeCoursePayload(req.body);
    const data = {};
    if (name !== undefined && name !== '') data.name = name;
    if (percent !== undefined) data.percent = percent;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const result = await prisma.course.updateMany({
      where: { id, userId: String(req.user) },
      data,
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const updated = await prisma.course.findUnique({ where: { id } });
    res.json({ course: toLegacy(updated) });
  } catch (e) {
    console.error('updateCourse error:', e);
    res.status(500).json({ error: 'Failed to update course' });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const id = req.params.id || req.params._id || req.body.id || req.body._id;
    if (!id || !/^[0-9a-fA-F]{24}$/.test(String(id))) {
      return res.status(400).json({ error: 'Invalid course id' });
    }

    const deleted = await prisma.course.deleteMany({
      where: { id, userId: String(req.user) },
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ ok: true });
  } catch (e) {
    console.error('deleteCourse error:', e);
    res.status(500).json({ error: 'Failed to delete course' });
  }
};
