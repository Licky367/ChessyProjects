const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");

#----- save session

const session = require("express-session");

app.use(session({
  secret: "secret-key",
  resave: false,
  saveUninitialized: false,
}));

// make user available in all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

const createRoutes = require("./routes/create");

const app = express();

// ===== MIDDLEWARE =====
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ===== STATIC FILES (optional but recommended) =====
app.use(express.static(path.join(__dirname, "public")));

// ===== VIEW ENGINE =====
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ===== LAYOUT CONFIG =====
app.use(expressLayouts);

// set default layout file (views/layout.ejs)
app.set("layout", "layout");

// ===== DATABASE =====
mongoose.connect("mongodb://127.0.0.1:27017/your-db-name")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// ===== ROUTES =====
app.use("/create-invite", createRoutes);

// optional: redirect home
app.get("/", (req, res) => {
  res.redirect("/create-invite");
});

// ===== 404 HANDLER =====
app.use((req, res) => {
  res.status(404).render("layout", {
    title: "Not Found",
    body: "<h2 style='text-align:center;'>Page Not Found</h2>"
  });
});

// ===== SERVER =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});