const express = require("express"),
  router = express.Router(),
  { sendWelcomeEmail, forgotPasswordEmail } = require("../../emails"),
  jwt = require("jsonwebtoken"),
  User = require("../../db/models/user");

// Create a user
router.post("/api/users", async (req, res) => {
  const user = new User(req.body);
  console.log(req.body);
  try {
    await user.save();
    const token = await user.generateAuthToken();
    res.cookie("jwt", token, {
      httpOnly: true,
      sameSite: "Strict",
      secure: process.env.NODE_ENV !== "production" ? false : true,
    });
    sendWelcomeEmail(user.email, user.name);
    res.json(user);
  } catch (e) {
    res.status(201).status(400).json({ error: e.toString() });
  }
});

//Login a user
router.post("/api/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.cookie("jwt", token, {
      httpOnly: true,
      sameSite: "Strict",
      secure: process.env.NODE_ENV !== "production" ? false : true,
    });
    res.json(user);
  } catch (e) {
    res.status(400).json({ error: e.toString() });
  }
});

module.exports = router;
