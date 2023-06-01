require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const globalErrorHandler = require("./controllers/errorController");
const userRoutes = require("./routes/userRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const schoolRoutes = require("./routes/schoolRoutes");

const app = express();

// Allow requests from all origins and include credentials (cookies)
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ROUTES
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/meetings", meetingRoutes);
app.use("/api/v1/schools", schoolRoutes);

app.all("*", (req, res, next) => {
  return res
    .status(404)
    .json({ error: `Can not find ${req.originalUrl} on this server` });
});

app.use(globalErrorHandler);

// START SERVER
module.exports = app;
