const path = require("path");
const cors = require("cors");

const compression = require("compression");
const rateLimit = require("express-rate-limit");
const csrf = require("csurf");
const cookieParser = require("cookie-parser");
const hpp = require("hpp");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss");
const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");

dotenv.config({ path: "config.env" });
const ApiError = require("./utils/apiError");
const globalError = require("./Middlewares/errorMiddleware");
const dbConnection = require("./config/database");

const csrfProtection = csrf({ cookie: true });

// Routes

const mountRoutes = require("./routes");

// Connect with db
dbConnection();

// express app
const app = express();

// Middlewares
app.use(cors());
app.options("*", cors());
app.use(cookieParser());

app.use(compression());

app.use(express.json({ limit: "10kb" }));
// to apply data sanitization
app.use(mongoSanitize());
app.use(express.static(path.join(__dirname, "uploads")));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
  console.log(`mode: ${process.env.NODE_ENV}`);
}
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  message: "Too many requests from this IP, please try again after 15 minutes",
});

// Apply the rate limiting middleware to all requests or you can set it on specific routes
app.use("/api", limiter);
// app.use(csrfProtection); //! this will apply in all routes

app.use(
  hpp({
    whitelist: [
      "price",
      "sold",
      "quantity",
      "ratingsAverage",
      "ratingsQuantity",
    ],
  })
);
// Mount Routes
mountRoutes(app);
app.get("/api/csrf-token", (req, res) => {
  // إرسال الرمز المميز (token) في الرد لكي يتمكن الفرونت من استخدامه
  res.json({ csrfToken: req.csrfToken() });
});
app.all("*", (req, res, next) => {
  next(new ApiError(`Can't find this route: ${req.originalUrl}`, 400));
});

// Global error handling middleware for express
app.use(globalError);

const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log(`App running running on port ${PORT}`);
});

// Handle rejection outside express
process.on("unhandledRejection", (err) => {
  console.error(`UnhandledRejection Errors: ${err.name} | ${err.message}`);
  server.close(() => {
    console.error(`Shutting down....`);
    process.exit(1);
  });
});
