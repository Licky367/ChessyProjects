// ================================
// DAIRY DASHBOARD LINKS
// ================================
exports.getDairyDashboardLinks = () => {
  return [
    { name: "Add Project", url: "/dairy/new", icon: "➕" },
    { name: "View Projects", url: "/dairy/projects", icon: "📂" },
    { name: "Facilities", url: "/structures", icon: "🏗️" },
    { name: "Production", url: "/milk", icon: "🥛" },
    { name: "Sales", url: "/sales", icon: "💰" },
    { name: "Statistics", url: "/milk/stats", icon: "📊" },
    { name: "Financials", url: "/financials/dashboard", icon: "📉" }
  ];
};

// ================================
// POULTRY DASHBOARD LINKS
// ================================
exports.getPoultryDashboardLinks = () => {
  return [
    { name: "Make Investment", url: "/finance", icon: "💵" },
    { name: "Start Incubation", url: "/incubation", icon: "🥚" },
    { name: "View Poultry Progress", url: "/nursing", icon: "📋" },
    { name: "View Caged Chicken", url: "/cage", icon: "🐓" },
    { name: "Poultry Analytics", url: "/poultry-stats", icon: "📊" },
    { name: "Sell Eggs", url: "/eggs", icon: "🛒" }
  ];
};

// ================================
// AGRICULTURE DASHBOARD LINKS
// ================================
exports.getAgricultureDashboardLinks = () => {
  return [
    { name: "Start Project", url: "/farm", icon: "🌱" },
    { name: "View Projects", url: "/farm/projects", icon: "📂" }
  ];
};