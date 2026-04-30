// services/updateService.js

const Update = require('../models/Update');
const Dairy = require('../models/dairy');

// AGE CALCULATOR
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

// FORMAT DAIRY
exports.formatDairy = (dairy) => {

  const hasIdentity = dairy.code >= 0;

  return {
    _id: dairy._id,
    name: dairy.name,
    code: dairy.code,
    mass: dairy.mass || 0,

    displayImage: dairy.profileImage
      ? `/uploads/${dairy.profileImage}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(dairy.name)}&background=198754&color=fff`,

    hasIdentity,

    gender: hasIdentity ? dairy.gender : null,
    isFemale: dairy.gender === 'Female',

    ageText: hasIdentity ? calculateAge(dairy.dob) : null,

    isMilking: dairy.isMilking,
    isMilkingText: dairy.isMilking ? 'Being Milked' : 'Not Milked'
  };
};

// FORMAT UPDATES
exports.formatUpdates = (updates) => {
  return updates.map(u => ({
    comment: u.comment,
    userName: u.user?.name || 'User',
    dateText: u.createdAt.toDateString()
  }));
};

// GET PAGE DATA
exports.getDairyPage = async (id) => {

  const dairy = await Dairy.findById(id);
  if (!dairy) throw new Error('Not found');

  const updates = await Update.find({ dairy: id })
    .populate('user', 'name')
    .sort({ createdAt: -1 });

  return {
    dairy: exports.formatDairy(dairy),
    updates: exports.formatUpdates(updates)
  };
};

// ADD COMMENT
exports.addComment = async ({ dairyId, userId, comment }) => {
  return Update.create({
    dairy: dairyId,
    user: userId,
    comment
  });
};

// UPDATE IMAGE
exports.updateImage = async ({ dairyId, userId, image }) => {

  await Dairy.findByIdAndUpdate(dairyId, {
    profileImage: image
  });

  return Update.create({
    dairy: dairyId,
    user: userId,
    image
  });
};