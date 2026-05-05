const express = require("express");
const http = require("http");
const path = require("path");
const mongoose = require("mongoose");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const { Server } = require("socket.io");

// ======================
// ROUTES
// ======================
const createRoutes = require("./routes/create");
const authRoutes = require("./routes/auth");
const updateRoutes = require("./routes/update");
const milkRoutes = require("./routes/milk");
const newRoutes = require("./routes/new");
const financialsRoutes = require("./routes/financials");
const indexRoutes = require("./routes/index");
const profileRoutes = require("./routes/profile");
const accountsRoutes = require("./routes/accounts");

#POULTRY ROUTES
const poultryStatsRoutes = require("./routes/poultryStats");
const eggRoutes = require("./routes/poultryEgg"); // if separated
const cageRoutes = require("./routes/poultryCage");
const nursingRoutes = require("./routes/poultryNursing");
const financeRoutes = require("./routes/poultryFinance");
const incubationRoutes = require("./routes/poultryIncubation");
const dashboardRoutes = require("./routes/dashboard");

#AGRICULTURE ROUTES
const farmRoutes = require("./routes/farm");


// ======================
// SOCKET HANDLER
// ======================
const socketHandler = require("./socket/socket");

// ======================
// SEED ADMIN
// ======================
const seedAdmin = require("./utils/seedAdmin");

// ======================
// INIT APP + SERVER
// ======================
const app = express();
const server = http.createServer(app);

// ======================
// SOCKET.IO SETUP
// ======================
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.set("io", io);
socketHandler(io);

// ======================
// DATABASE CONNECTION
// ======================
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/project_db";

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("🟢 MongoDB Connected");

    // ✅ AUTO SEED ADMIN
    await seedAdmin();
  })
  .catch((err) => console.log("🔴 MongoDB Error:", err));

// ======================
// MIDDLEWARE
// ======================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ======================
// SESSION CONFIG
// ======================
app.use(
  session({
    secret: process.env.SESSION_SECRET || "super-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// ======================
// GLOBAL USER (EJS)
// ======================
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// ======================
// STATIC FILES
// ======================
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// ======================
// VIEW ENGINE
// ======================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(expressLayouts);
app.set("layout", "layout");

// ======================
// ROUTES
// ======================
app.use("/", indexRoutes);
app.use("/create-invite", createRoutes);
app.use("/", authRoutes);
app.use("/", updateRoutes);
app.use("/", profileRoutes);
app.use("/", milkRoutes);
app.use("/accounts", accountsRoutes);
app.use("/financials", financialsRoutes);
app.use("/dairy", newRoutes);
app.use("/poultry-stats", poultryStatsRoutes);
app.use("/eggs", eggRoutes);
app.use("/cage", cageRoutes);
app.use("/nursing", nursingRoutes);
app.use("/incubation", incubationRoutes);
app.use("/finance", financeRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/farm", farmRoutes);

// ======================
// 404 HANDLER
// ======================
app.use((req, res) => {
  res.status(404).render("index", {
    user: null,
  });
});

// ======================
// START SERVER
// ======================
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});