const dotenv = require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./models/User");
const ScheduleModel = require("./models/Schedule");
const bcrypt = require("bcryptjs");
const app = express();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const uploadMiddleware = multer({ dest: "uploads/" });
const fs = require("fs");
const UserMessageModel = require("./models/UserMessage");

const salt = bcrypt.genSaltSync(10);

app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(__dirname + "/uploads"));

mongoose.connect(process.env.URI);

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const userDoc = await User.create({
      username,
      password: bcrypt.hashSync(password, salt),
    });
    res.json(userDoc);
  } catch (e) {
    res.status(400).json(e);
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const userDoc = await User.findOne({ username });
  var passOk = "";
  password === ""
    ? (passOk = "")
    : (passOk = bcrypt.compareSync(password, userDoc.password));
  if (passOk) {
    jwt.sign(
      { username, id: userDoc._id },
      process.env.SECRET,
      {},
      (err, token) => {
        if (err) throw err;
        res.cookie("token", token).json({
          id: userDoc._id,
          username,
        });
      }
    );
  } else {
    res.status(400).json("Wrong credentials!");
  }
});

app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, process.env.SECRET, {}, (err, info) => {
    if (err) throw err;
    res.json(info);
  });
});

app.post("/logout", (req, res) => {
  res.cookie("token", "").json("ok");
});

app.post("/schedule", uploadMiddleware.single("file"), async (req, res) => {
  try {
    const { originalname, path } = req.file;
    const parts = originalname.split(".");
    const ext = parts[parts.length - 1];
    const newPath = path + "." + ext;
    fs.renameSync(path, newPath);

    const { token } = req.cookies;
    jwt.verify(token, process.env.SECRET, {}, async (err, info) => {
      if (err) throw err;

      const { title, about, numPeriods, url, periods } = req.body;
      const periodsArray = JSON.parse(periods);

      const scheduleDoc = await ScheduleModel.create({
        title,
        about,
        numPeriods,
        cover: newPath,
        url,
        author: info.id,
        periods: periodsArray,
      });

      res.json(scheduleDoc);
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Failed to create schedule" });
  }
});

app.get("/schedule", async (req, res) => {
  res.json(
    await ScheduleModel.find()
      .populate("author", ["username"])
      .sort({ createdAt: -1 })
  );
});

app.get("/schedule/:url", async (req, res) => {
  const { url } = req.params;
  const scheduleDoc = await ScheduleModel.findOne({ url })
    .populate("author", ["username"])
    .populate("messages"); // Populate messages
  res.json(scheduleDoc);
});

app.post("/schedule/:url/message", async (req, res) => {
  const { url } = req.params;
  const { text } = req.body;
  const { token } = req.cookies;

  jwt.verify(token, process.env.SECRET, {}, async (err, info) => {
    if (err) return res.status(401).json("Invalid token");

    try {
      const schedule = await ScheduleModel.findOne({ url });
      if (!schedule) {
        return res.status(404).json("Schedule not found");
      }

      const newMessage = await UserMessageModel.create({
        text,
        author: info.id,
        schedule: schedule._id,
      });

      schedule.messages.push(newMessage._id);
      await schedule.save();

      res.json(newMessage);
    } catch (error) {
      console.error(error);
      res.status(500).json("Server error");
    }
  });
});

app.listen(4000);
