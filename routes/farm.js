const express = require('express');
const router = express.Router();
const farmController = require('../controllers/farmController');

// Form to create project
router.get('/', farmController.showCreateForm);
router.post('/create', farmController.createProject);

// List of all projects
router.get('/projects', farmController.listProjects);

// Project details
router.get('/details', farmController.showProjectDetails);

// Begin project
router.post('/begin', farmController.beginProject);

// Add additional cost
router.post('/add-cost', farmController.addCost);

module.exports = router;