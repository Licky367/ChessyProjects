const NursingBatch = require("../models/NursingBatch");
const financeService = require("./financeService");

exports.createFromPurchase = async (data) => {
  return await NursingBatch.create({
    ...data,
    source: "purchase",
    available: data.total
  });
};

exports.getActiveBatches = async () => {
  return await NursingBatch.find({ status: "active", available: { $gt: 0 } });
};

exports.getBatchById = async (id) => {
  return await NursingBatch.findById(id);
};

exports.recordDeath = async ({ batchId, count, cause, user }) => {
  const batch = await NursingBatch.findById(batchId);

  if (!batch) throw new Error("Batch not found");

  batch.available -= count;

  batch.deaths.push({
    count,
    cause,
    recordedBy: user._id,
    profileImage: user.profileImage
  });

  if (batch.available <= 0) {
    batch.available = 0;
    batch.status = "depleted";
  }

  await batch.save();

  return batch;
};

exports.sellPoultry = async ({ batchId, count, amount, user }) => {
  const batch = await NursingBatch.findById(batchId);

  if (!batch) throw new Error("Batch not found");

  batch.available -= count;

  if (batch.available <= 0) {
    batch.available = 0;
    batch.status = "depleted";
  }

  await batch.save();

  await financeService.recordPoultrySale({
    amount,
    quantity: count,
    batchId,
    userId: user._id
  });

  return batch;
};

exports.cageBatch = async ({ batchId, perCage }) => {
  const Cage = require("../models/Cage");

  const batch = await NursingBatch.findById(batchId);

  if (!batch) throw new Error("Batch not found");

  if (batch.poultryType !== "chicken") {
    throw new Error("Only chicken can be caged");
  }

  const cages = Math.ceil(batch.available / perCage);

  for (let i = 0; i < cages; i++) {
    const count = i === cages - 1
      ? batch.available - (perCage * i)
      : perCage;

    await Cage.create({
      cageName: `Cage ${i + 1}`,
      total: count,
      available: count,
      dob: batch.dob
    });
  }

  batch.available = 0;
  batch.status = "caged";

  await batch.save();

  return true;
};