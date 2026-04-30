// services/updateService.js

const Update = require('../models/Update');
const Dairy = require('../models/dairy');


// =========================
// AGE CALCULATOR
// =========================
function calculateAge(dob) {
  if (!dob) return null;

  const now = new Date();
  const birth = new Date(dob);

  let y = now.getFullYear() - birth.getFullYear();
  let m = now.getMonth() - birth.getMonth();
  let d = now.getDate() - birth.getDate();

  if (d < 0) {
    m--;
    d += 30;
  }

  if (m < 0) {
    y--;
    m += 12;
  }

  return `${y} years, ${m} months, ${d} days`;
}


// =========================
// FORMAT DATE (better UX)
// =========================
function formatDate(date) {
  return new Date(date).toLocaleString(); // cleaner than toDateString()
}


// =========================
// FORMAT DAIRY
// =========================
exports.formatDairy = (dairy, imageUpdates = []) => {

  const hasIdentity = dairy.code >= 0;

  // latest image first (fallback to profileImage)
  const latestImage = imageUpdates.length
    ? `/uploads/${imageUpdates[0].image}`
    : (dairy.profileImage
        ? `/uploads/${dairy.profileImage}`
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(dairy.name)}&background=198754&color=fff`);

  return {
    _id: dairy._id,
    name: dairy.name,
    code: dairy.code,
    mass: dairy.mass || 0,

    displayImage: latestImage,

    // image history (for gallery)
    images: imageUpdates.map(u => `/uploads/${u.image}`),

    hasIdentity,

    gender: hasIdentity ? dairy.gender : null,
    isFemale: dairy.gender === 'Female',

    ageText: hasIdentity ? calculateAge(dairy.dob) : null,

    isMilking: dairy.isMilking,
    isMilkingText: dairy.isMilking ? 'Being Milked' : 'Not Milked'
  };
};


// =========================
// FORMAT COMMENTS ONLY
// =========================
exports.formatUpdates = (updates) => {
  return updates
    .filter(u => u.comment) // only comments
    .map(u => ({
      comment: u.comment,
      userName: u.user?.name || 'User',
      dateText: formatDate(u.createdAt)
    }));
};


// =========================
// GET PAGE DATA
// =========================
exports.getDairyPage = async (id) => {

  const dairy = await Dairy.findById(id);
  if (!dairy) throw new Error('Not found');

  // ALL updates
  const updates = await Update.find({ dairy: id })
    .populate('user', 'name')
    .sort({ createdAt: -1 });

  // ONLY image updates (for gallery)
  const imageUpdates = updates.filter(u => u.type === 'image' && u.image);

  return {
    dairy: exports.formatDairy(dairy, imageUpdates),
    updates: exports.formatUpdates(updates)
  };
};


// =========================
// ADD COMMENT
// =========================
exports.addComment = async ({ dairyId, userId, comment }) => {

  if (!comment || !comment.trim()) {
    throw new Error('Comment is required');
  }

  return Update.create({
    dairy: dairyId,
    user: userId,
    comment,
    type: 'comment'
  });
};


// =========================
// UPDATE IMAGE
// =========================
exports.updateImage = async ({ dairyId, userId, image }) => {

  if (!image) {
    throw new Error('Image is required');
  }

  // update current profile image
  await Dairy.findByIdAndUpdate(dairyId, {
    profileImage: image
  });

  // store history
  return Update.create({
    dairy: dairyId,
    user: userId,
    image,
    type: 'image'
  });
};