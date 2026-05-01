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
   🆕 WEEK HELPERS
========================= */
function getWeekRange(date) {
  const d = new Date(date);

  const day = d.getDay(); // 0 (Sun) - 6 (Sat)
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
   🆕 WEEKLY MILK SUMMARY
========================= */
async function getWeeklyMilkSummary(dairyId) {

  const dairy = await Dairy.findById(dairyId);
  if (!dairy || !dairy.isMilking) return [];

  const records = await Milk.find({ dairy: dairyId })
    .sort({ date: -1 });

  if (!records.length) return [];

  const weeks = {};

  records.forEach(r => {
    const { start, end } = getWeekRange(r.date);
    const key = start.toISOString();

    if (!weeks[key]) {
      weeks[key] = {
        weekStart: start,
        weekEnd: end,
        days: {},
        total: 0
      };
    }

    const dayKey = r.day;

    if (!weeks[key].days[dayKey]) {
      weeks[key].days[dayKey] = 0;
    }

    weeks[key].days[dayKey] += r.liters;
    weeks[key].total += r.liters;
  });

  /* FORMAT */
  return Object.values(weeks)
    .sort((a, b) => b.weekStart - a.weekStart)
    .slice(0, 6) // last 6 weeks
    .map(w => {

      const daysArr = Object.keys(w.days)
        .sort()
        .map(d => ({
          day: d,
          total: w.days[d]
        }));

      const avg = daysArr.length
        ? (w.total / daysArr.length).toFixed(2)
        : 0;

      return {
        userName: 'System',
        avatar: `https://ui-avatars.com/api/?name=System&background=0d6efd&color=fff`,
        dateText: new Date(w.weekEnd).toLocaleString(),

        title: `Weekly milking summary of ${dairy.name} from ${w.weekStart.toISOString().split('T')[0]} to ${w.weekEnd.toISOString().split('T')[0]}`,

        days: daysArr,
        total: w.total,
        average: avg
      };
    });
}


/* =========================
   FORMAT DAIRY
========================= */
exports.formatDairy = (dairy, imageUpdates = []) => {

  const hasIdentity = dairy.code >= 0;

  const images = imageUpdates
    .filter(u => u.image)
    .map(u => `/uploads/${u.image}`);

  const latestImage =
    images.length > 0
      ? images[0]
      : dairy.profileImage
        ? `/uploads/${dairy.profileImage}`
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(dairy.name)}&background=198754&color=fff`;

  return {
    _id: dairy._id,
    name: dairy.name,
    code: dairy.code,
    mass: dairy.mass || 0,

    displayImage: latestImage,
    images,

    hasIdentity,
    gender: hasIdentity ? dairy.gender : null,
    isFemale: dairy.gender === 'Female',
    ageText: hasIdentity ? calculateAge(dairy.dob) : null,

    isMilking: dairy.isMilking,
    isMilkingText: dairy.isMilking ? 'Being Milked' : 'Not Milked',

    medicalAttention: {
      isMarked: dairy?.medicalAttention?.isMarked || false,
      type: dairy?.medicalAttention?.type || '',
      details: dairy?.medicalAttention?.details || '',
      markedAt: dairy?.medicalAttention?.markedAt || null,
      likes: dairy?.medicalAttention?.likes || 0
    }
  };
};


/* =========================
   FORMAT COMMENTS
========================= */
exports.formatUpdates = (updates = []) => {
  return updates
    .filter(u => u.comment && u.type === 'comment')
    .map(u => ({
      _id: u._id,
      comment: u.comment,
      userName: u.user?.name || 'User',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.user?.name || 'User')}&background=6c757d&color=fff`,
      dateText: formatDate(u.createdAt),
      createdAt: u.createdAt
    }));
};


/* =========================
   FORMAT POSTS
========================= */
exports.formatPosts = (posts = []) => {
  return posts.map(p => ({
    _id: p._id,
    userId: p.user,
    userName: p.userName,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(p.userName)}&background=198754&color=fff`,
    text: p.text || '',
    image: p.image || null,
    likes: p.likes?.length || 0,
    comments: (p.comments || []).map(c => ({
      _id: c._id,
      userId: c.userId,
      userName: c.userName,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.userName)}&background=6c757d&color=fff`,
      text: c.text,
      dateText: formatDate(c.createdAt)
    })),
    createdAt: p.createdAt,
    dateText: formatDate(p.createdAt)
  }));
};


/* =========================
   PROFILE PAGE DATA
========================= */
exports.getDairyPage = async (id) => {

  const dairy = await Dairy.findById(id);
  if (!dairy) throw new Error('Not found');

  const updates = await Update.find({ dairy: id })
    .populate('user', 'name')
    .sort({ createdAt: -1 });

  const imageUpdates = updates.filter(u => u.type === 'image');

  const comments = exports.formatUpdates(updates);

  const postsRaw = updates
    .filter(u => u.type === 'post')
    .sort((a, b) => b.createdAt - a.createdAt);

  const posts = exports.formatPosts(postsRaw);

  const weeklyMilk = await getWeeklyMilkSummary(id); // ✅ NEW

  return {
    dairy: exports.formatDairy(dairy, imageUpdates),
    updates: comments,
    posts,
    weeklyMilk, // ✅ NEW
    commentCount: comments.length
  };
};


/* =========================
   POSTS SYSTEM (UNCHANGED)
========================= */

exports.createPost = async ({ dairyId, userId, userName, text, image }) => {
  return Update.create({
    dairy: dairyId,
    user: userId,
    userName,
    text,
    image,
    type: 'post',
    likes: [],
    comments: []
  });
};

exports.toggleLike = async ({ postId, userId }) => {
  const post = await Update.findById(postId);
  if (!post) throw new Error('Post not found');

  const index = post.likes.findIndex(id => id.toString() === userId.toString());

  if (index > -1) post.likes.splice(index, 1);
  else post.likes.push(userId);

  await post.save();

  return { likes: post.likes.length };
};

exports.addPostComment = async ({ postId, userId, userName, text }) => {
  const post = await Update.findById(postId);
  if (!post) throw new Error('Post not found');

  const comment = {
    _id: new Date().getTime().toString(),
    userId,
    userName,
    text,
    createdAt: new Date()
  };

  post.comments.push(comment);
  await post.save();

  return comment;
};

exports.deletePost = async ({ postId, user }) => {
  const post = await Update.findById(postId);
  if (!post) return false;

  const isOwner = post.user.toString() === user._id.toString();
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isAdmin) return false;

  await post.deleteOne();
  return true;
};

exports.deleteComment = async ({ commentId, user }) => {
  const post = await Update.findOne({ "comments._id": commentId });
  if (!post) return false;

  const comment = post.comments.id(commentId);
  if (!comment) return false;

  const isOwner = comment.userId.toString() === user._id.toString();
  const isPostOwner = post.user.toString() === user._id.toString();
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isPostOwner && !isAdmin) return false;

  comment.remove();
  await post.save();

  return true;
};


/* =========================
   EXISTING METHODS
========================= */

exports.getPositiveDairies = async () => {
  const dairies = await Dairy.find({ code: { $gt: 0 } }).sort({ createdAt: -1 });
  return dairies.map(d => ({
    _id: d._id,
    name: d.name,
    code: d.code,
    profileImage: d.profileImage
  }));
};

exports.getNegativeDairies = async () => {
  const dairies = await Dairy.find({ code: { $lt: 0 } }).sort({ createdAt: -1 });
  return dairies.map(d => ({
    _id: d._id,
    name: d.name,
    code: d.code,
    profileImage: d.profileImage
  }));
};

exports.addComment = async ({ dairyId, userId, comment }) => {
  const clean = comment?.trim();
  if (!clean) throw new Error('Comment is required');

  return Update.create({
    dairy: dairyId,
    user: userId,
    comment: clean,
    type: 'comment'
  });
};

exports.updateImage = async ({ dairyId, userId, image }) => {
  await Dairy.findByIdAndUpdate(dairyId, { profileImage: image });

  return Update.create({
    dairy: dairyId,
    user: userId,
    image,
    type: 'image'
  });
};

exports.markMedicalAttention = async ({ dairyId, userId, type, details }) => {
  const dairy = await Dairy.findById(dairyId);
  if (!dairy) throw new Error('Not found');

  dairy.medicalAttention = {
    isMarked: true,
    type,
    details,
    markedBy: userId,
    markedAt: new Date()
  };

  await dairy.save();
  return dairy;
};

exports.unmarkMedicalAttention = async ({ dairyId }) => {
  const dairy = await Dairy.findById(dairyId);
  if (!dairy) throw new Error('Not found');

  dairy.medicalAttention = {
    isMarked: false
  };

  await dairy.save();
  return dairy;
};