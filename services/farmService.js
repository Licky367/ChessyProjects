const Farm = require('../models/farm');
const FarmFinance = require('../models/farmFinance');

exports.createProject = async (data) => {
  const project = new Farm(data);
  return await project.save();
};

exports.getAllProjects = async () => {
  return await Farm.find().sort({ createdAt: -1 });
};

exports.getProjectById = async (id) => {
  return await Farm.findById(id);
};

exports.markProjectBegun = async (id) => {
  const project = await Farm.findById(id);
  if (!project) throw new Error('Project not found');
  project.status = 'Begun';
  await project.save();

  // Save initial cost in farmFinance
  await FarmFinance.create({
    project: project._id,
    costDescription: 'Initial Cost',
    amount: project.initialCost,
  });

  return project;
};

exports.addAdditionalCost = async (projectId, costDescription, amount) => {
  return await FarmFinance.create({
    project: projectId,
    costDescription,
    amount,
  });
};

exports.getProjectFinance = async (projectId) => {
  return await FarmFinance.find({ project: projectId });
};