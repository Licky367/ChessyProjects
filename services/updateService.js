const Update = require('../models/Update');
const Dairy = require('../models/dairy');
const Milk = require('../models/milk');


/* =========================
   AGE CALCULATOR
========================= */
function calculateAge(dob) {
  if (!dob) return null;

  const now = new Date();
  const birth = new Date(dob);

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return `${years} years, ${months} months, ${days} days`;
}


/* =========================
   FORMAT DATE
========================= */
function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleString();
}


/* =========================
   WEEK RANGE
========================= */
function getWeekRange(date) {
  const d = new Date(date);

  const day = d.getDay();
  const diffToMonday = (day === 0 ? -6 : 1 - day);

  const start = new Date(d);
  start.setDate(d.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}


/* =========================
   MILK FEED
========================= */
async function getWeeklyMilkFeed(dairyId) {
  const dairy = await Dairy.findById(dairyId);
  if (!dairy || !dairy.isMilking) return null;

  const records = await Milk.find({ dairy: dairyId }).sort({ date: -1 });
  if (!records.length) return null;

  const weeks = {};

  records.forEach(r => {
    const { start, end } = getWeekRange(r.date);
    const key = start.toISOString();

    if (!weeks[key]) {
      weeks[key] = { weekStart: start, weekEnd: end, days: {}, total: 0 };
    }

    if (!weeks[key].days[r.day]) {
      weeks[key].days[r.day] = 0;
    }

    weeks[key].days[r.day] += r.liters;
    weeks[key].total += r.liters;
  });

  const latest = Object.values(weeks)
    .sort((a, b) => b.weekStart - a.weekStart)[0];

  if (!latest) return null;

  const daysArr = Object.keys(latest.days).sort().map(d => ({
    day: d,
    total: latest.days[d]
  }));

  const avg = daysArr.length
    ? (latest.total / daysArr.length).toFixed(2)
    : 0;

  return {
    type: 'milk',
    _sortDate: latest.weekEnd,

    userName: 'System',
    userImage: 'https://ui-avatars.com/api/?name=System&background=0d6efd&color=fff',
    dateText: formatDate(latest.weekEnd),

    title: `Weekly milk report (${latest.weekStart.toISOString().split('T')[0]} → ${latest.weekEnd.toISOString().split('T')[0]})`,

    weekStart: latest.weekStart,
    weekEnd: latest.weekEnd,

    days: daysArr,
    total: latest.total,
    average: avg
  };
}


/* =========================
   POSTS
========================= */
function formatPosts(posts = []) {
  return posts.map(p => ({
    type: 'post',
    _sortDate: p.createdAt,

    _id: p._id,
    userId: p.user,
    userName: p.userName,
    userImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(p.userName)}&background=198754&color=fff`,
    text: p.text || '',
    image: p.image || null,

    likes: p.likes?.length || 0,

    comments: (p.comments || []).map(c => ({
      _id: c._id,
      userId: c.userId,
      userName: c.userName,
      userImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.userName)}&background=6c757d&color=fff`,
      text: c.text,
      dateText: formatDate(c.createdAt)
    })),

    createdAt: p.createdAt,
    dateText: formatDate(p.createdAt)
  }));
}


/* =========================
   MEDICAL FEED
========================= */
function formatMedical(dairy) {
  if (!dairy?.medicalAttention?.isMarked) return null;

  return {
    type: 'medical',
    _sortDate: dairy.medicalAttention.markedAt,

    _id: 'medical_' + dairy._id,
    userName: 'System',
    userImage: 'https://ui-avatars.com/api/?name=Medical&background=c62828&color=fff',
    dateText: formatDate(dairy.medicalAttention.markedAt),

    title: '🚨 Medical Attention Required',
    details: dairy.medicalAttention.details,
    medicalType: dairy.medicalAttention.type
  };
}


/* =========================================================
   🟩 MAINTENANCE FEED (NEW)
========================================================= */
function formatMaintenance(update) {
  if (update.type !== 'maintenance') return null;

  return {
    type: 'maintenance',
    _id: update._id,
    _sortDate: update.createdAt,

    userId: update.user,
    userName: update.user?.name || 'Unknown',
    userImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(update.user?.name || 'User')}`,

    dateText: formatDate(update.createdAt),

    status: update.maintenance?.status,

    title:
      update.maintenance?.status === 'marked'
        ? '🔧 Maintenance Required'
        : '✅ Maintenance Cleared',

    maintenanceType: update.maintenance?.type,
    description:
      update.maintenance?.status === 'marked'
        ? update.maintenance?.description
        : update.maintenance?.clearDescription,

    charges: update.maintenance?.charges || null
  };
}


/* =========================
   MAIN FEED BUILDER
========================= */
exports.getDairyPage = async (id) => {

  const dairy = await Dairy.findById(id);
  if (!dairy) throw new Error('Not found');

  const updates = await Update.find({ dairy: id })
    .populate('user', 'name')
    .sort({ createdAt: -1 });

  const posts = formatPosts(
    updates.filter(u => u.type === 'post')
  );

  const maintenanceFeed = updates
    .filter(u => u.type === 'maintenance')
    .map(formatMaintenance)
    .filter(Boolean);

  const milkFeed = await getWeeklyMilkFeed(id);
  const medicalFeed = formatMedical(dairy);

  let feed = [
    ...posts,
    ...maintenanceFeed
  ];

  if (milkFeed) feed.push(milkFeed);
  if (medicalFeed) feed.push(medicalFeed);

  feed = feed.sort(
    (a, b) => new Date(b._sortDate) - new Date(a._sortDate)
  );

  return {
    dairy: {
      ...dairy.toObject(),
      displayImage: dairy.profileImage
        ? `/uploads/${dairy.profileImage}`
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(dairy.name)}`
    },

    feed,

    commentCount: updates.filter(u => u.type === 'comment').length
  };
};


/* =========================================================
   🟩 MAINTENANCE SERVICE: MARK
========================================================= */
exports.markMaintenance = async ({ dairyId, userId, type, description }) => {

  const dairy = await Dairy.findById(dairyId);
  if (!dairy) throw new Error('Dairy not found');

  if (dairy.needsMaintenance === true) {
    throw new Error('Already marked');
  }

  dairy.needsMaintenance = true;
  await dairy.save();

  const update = await Update.create({
    dairy: dairyId,
    user: userId,
    type: 'maintenance',
    maintenance: {
      status: 'marked',
      type,
      description,
      markedAt: new Date(),
      markedBy: userId
    }
  });

  return update;
};


/* =========================================================
   🟦 MAINTENANCE SERVICE: CLEAR
========================================================= */
exports.clearMaintenance = async ({ dairyId, userId, charges, description }) => {

  const dairy = await Dairy.findById(dairyId);
  if (!dairy) throw new Error('Dairy not found');

  if (dairy.needsMaintenance === false) {
    throw new Error('Not currently under maintenance');
  }

  dairy.needsMaintenance = false;
  await dairy.save();

  const update = await Update.create({
    dairy: dairyId,
    user: userId,
    type: 'maintenance',
    maintenance: {
      status: 'cleared',
      charges,
      clearDescription: description,
      clearedAt: new Date(),
      clearedBy: userId
    }
  });

  return update;
};