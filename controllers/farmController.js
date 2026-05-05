const farmService = require('../services/farmService');

exports.showCreateForm = (req, res) => {
  res.render('farm', { title: 'Create Farm Project' });
};

exports.createProject = async (req, res) => {
  try {
    await farmService.createProject(req.body);
    res.redirect('/farm/projects');
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.listProjects = async (req, res) => {
  const projects = await farmService.getAllProjects();
  res.render('farmProjects', { title: 'Farm Projects', projects });
};

exports.showProjectDetails = async (req, res) => {
  const project = await farmService.getProjectById(req.query.id);
  if (!project) return res.status(404).send('Project not found');

  const finances = await farmService.getProjectFinance(project._id);
  res.render('farmDetails', { title: 'Project Details', project, finances });
};

exports.beginProject = async (req, res) => {
  try {
    const project = await farmService.markProjectBegun(req.body.id);
    res.redirect(`/farm/details?id=${project._id}`);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.addCost = async (req, res) => {
  try {
    await farmService.addAdditionalCost(req.body.projectId, req.body.costDescription, req.body.amount);
    res.redirect(`/farm/details?id=${req.body.projectId}`);
  } catch (err) {
    res.status(500).send(err.message);
  }
};