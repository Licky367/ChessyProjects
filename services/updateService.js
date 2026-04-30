const Update = require('../models/Update');
const Dairy = require('../models/dairy');


// =========================
// AGE CALCULATOR (FIXED)
// =========================
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


// =========================
// FORMAT DATE
// =========================
function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleString();
}


// =========================
// FORMAT DAIRY (FB STYLE PROFILE)
// =========================
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
    images, // full gallery

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
exports.formatUpdates = (updates = []) => {

  return updates
    .filter(u => u.comment && u.type === 'comment')
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

  const updates = await Update.find({ dairy: id })
    .populate('user', 'name')
    .sort({ createdAt: -1 });

  const imageUpdates = updates.filter(
    u => u.type === 'image' && u.image
  );

  return {
    dairy: exports.formatDairy(dairy, imageUpdates),
    updates: exports.formatUpdates(updates)
  };
};


// =========================
// ADD COMMENT
// =========================
exports.addComment = async ({ dairyId, userId, comment }) => {

  const clean = comment?.trim();

  if (!clean) {
    throw new Error('Comment is required');
  }

  return Update.create({
    dairy: dairyId,
    user: userId,
    comment: clean,
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

  // update main profile image
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