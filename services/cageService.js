const Cage = require("../models/Cage");
const EggStock = require("../models/EggStock");
const financeService = require("./financeService");

exports.getCages = async () => {
  return await Cage.find({ available: { $gt: 0 } });
};

exports.getCageById = async (id) => {
  return await Cage.findById(id);
};

exports.collectEggs = async ({ cageId, eggs }) => {
  const cage = await Cage.findById(cageId);

  cage.eggsAvailable += eggs;

  await cage.save();

  await EggStock.findOneAndUpdate(
    { poultryType: "chicken" },
    { $inc: { totalAvailable: eggs } },
    { upsert: true }
  );

  return cage;
};

exports.sellChicken = async ({ cageId, count, amount, user }) => {
  const cage = await Cage.findById(cageId);

  cage.available -= count;

  if (cage.available <= 0) {
    await Cage.findByIdAndDelete(cageId);
  } else {
    await cage.save();
  }

  await financeService.recordPoultrySale({
    amount,
    quantity: count,
    userId: user._id
  });

  return true;
};