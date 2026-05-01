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
const indexRoutes = require("./routes/index");

// ======================
// SOCKET HANDLER
// ======================
const socketHandler = require("./socket/socket");


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
    methods: ["GET", "POST"]
  }
});

// attach io globally
app.set("io", io);

// initialize socket logic
socketHandler(io);


// ======================
// DATABASE
// ======================
mongoose.connect("mongodb://127.0.0.1:27017/your-db-name")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB Error:", err));


// ======================
// MIDDLEWARE
// ======================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// ======================
// SESSION
// ======================
app.use(session({
  secret: "secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// expose user globally in EJS
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

// layout system
app.use(expressLayouts);
app.set("layout", "layout");


// ======================
// ROUTES
// ======================
app.use("/", indexRoutes);              // ✅ HOME PAGE (index.ejs)
app.use("/create-invite", createRoutes);
app.use("/", authRoutes);
app.use("/", updateRoutes);
app.use("/", milkRoutes);
app.use("/dairy", newRoutes);


// ======================
// 404 HANDLER
// ======================
app.use((req, res) => {
  res.status(404).render("index", {
    user: { name: "Guest" }
  });
});


// ======================
// START SERVER
// ======================
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});