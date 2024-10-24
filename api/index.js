const dotenv = require("dotenv");
const path = require("path");
// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../config.env") });

const cors = require("cors");
const compression = require("compression");
const morgan = require("morgan");
const express = require("express");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const csrf = require("csurf");
const cookieParser = require("cookie-parser");

const ApiError = require("../utils/apiError");
const globalError = require("../Middlewares/errorMiddleware");
const dbConnection = require("../config/database");
const mountRoutes = require("../routes");

const { webhookCheckout } = require("../services/orderService");

// Connect with db
dbConnection();

// express app
const app = express();

// Middlewares
app.use(cors());
app.options("*", cors());
app.use(compression());

// To parse cookies for CSRF protection
app.use(cookieParser());

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "../uploads")));

// Apply data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Apply rate limiting to all API routes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use("/api", limiter);

// Protect against HTTP parameter pollution
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

// CSRF protection (optional, uncomment if needed)
// const csrfProtection = csrf({ cookie: true });
// app.use(csrfProtection);

app.post(
  "/webhook-checkout",
  express.raw({ type: "application/json" }),
  webhookCheckout
);

// Log requests in development mode
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Mount Routes
mountRoutes(app);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.all("*", (req, res, next) => {
  next(new ApiError(`Can't find this route: ${req.originalUrl}`, 400));
});

// Global error handling middleware for express
app.use(globalError);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
