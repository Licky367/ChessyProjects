const dashboardService = require("../services/dashboardService");

// ================================
// DAIRY DASHBOARD
// ================================
exports.getDairyDashboard = (req, res) => {
  const dashboardData = dashboardService.getDairyDashboardLinks();

  res.render("dairyDashboard", {
    title: "Dairy Dashboard",
    user: req.user,
    links: dashboardData
  });
};

// ================================
// POULTRY DASHBOARD
// ================================
exports.getPoultryDashboard = (req, res) => {
  const dashboardData = dashboardService.getPoultryDashboardLinks();

  res.render("poultryDashboard", {
    title: "Poultry Dashboard",
    user: req.user,
    links: dashboardData
  });
};

// ================================
// AGRICULTURE DASHBOARD
// ================================
exports.getAgricultureDashboard = (req, res) => {
  const dashboardData = dashboardService.getAgricultureDashboardLinks();

  res.render("agricultureDashboard", {
    title: "Agriculture Dashboard",
    user: req.user,
    links: dashboardData
  });
};