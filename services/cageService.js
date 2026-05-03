// services/cageService.js

const Cage = require("../models/Cage");
const EggStock = require("../models/EggStock");
const financeService = require("./financeService");

const POULTRY_TYPE = "chicken";

exports.getCages = async () => {
  return await Cage.find({ available: { $gt: 0 } });
};

exports.getCageById = async (id) => {
  return await Cage.findById(id);
};

// =========================
// COLLECT EGGS
// =========================
exports.collectEggs = async ({ cageId, eggs }) => {
  const cage = await Cage.findById(cageId);
  if (!cage) throw new Error("Cage not found");

  eggs = Number(eggs);
  if (!eggs || eggs <= 0) throw new Error("Invalid eggs value");

  cage.eggsAvailable += eggs;
  await cage.save();

  await EggStock.findOneAndUpdate(
    { poultryType: POULTRY_TYPE },
    { $inc: { totalAvailable: eggs } },
    { upsert: true }
  );

  return cage;
};

// =========================
// SELL CHICKEN
// =========================
exports.sellChicken = async ({ cageId, count, amount, user }) => {
  const cage = await Cage.findById(cageId);
  if (!cage) throw new Error("Cage not found");

  count = Number(count);
  amount = Number(amount);

  if (!count || count <= 0) throw new Error("Invalid chicken count");
  if (amount < 0) throw new Error("Invalid amount");

  if (count > cage.available) {
    throw new Error("Not enough chicken available");
  }

  cage.available -= count;

  if (cage.available <= 0) {
    await Cage.findByIdAndDelete(cageId);
  } else {
    await cage.save();
  }

  await financeService.recordPoultrySale({
    amount,
    quantity: count,
    poultryType: POULTRY_TYPE,
    userId: user._id
  });

  return true;
};

// =========================
// DEAD CHICKEN (LOSS)
// =========================
exports.recordDeadChicken = async ({ cageId, count, user }) => {
  const cage = await Cage.findById(cageId);
  if (!cage) throw new Error("Cage not found");

  count = Number(count);
  if (!count || count <= 0) throw new Error("Invalid dead chicken count");

  if (count > cage.available) {
    throw new Error("Dead count exceeds available chicken");
  }

  cage.available -= count;

  if (cage.available <= 0) {
    await Cage.findByIdAndDelete(cageId);
  } else {
    await cage.save();
  }

  return true;
};