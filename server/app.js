const express = require("express"),
  openRoutes = require("./routes/open/users"),
  secureRoutes = require("./routes/secure/users"),
  path = require("path"),
  cookieParser = require("cookie-parser"),
  app = express();

//incoming JSON parse
app.use(express.json());

//unauthenticated routes
app.use(openRoutes);
app.use(cookieParser());

if (process.env.NODE_ENV === "production") {
  // Serve any static files
  app.use(express.static(path.join(__dirname, "../client/build")));
}

//authenticated routes
app.use(secureRoutes);

if (process.env.NODE_ENV === "production") {
  // Handle React routing, return all requests to React app
  app.get("*", (request, response) => {
    response.sendFile(path.join(__dirname, "../client/build", "index.html"));
  });
}
module.exports = app;
