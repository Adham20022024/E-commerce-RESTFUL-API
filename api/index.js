const dotenv = require("dotenv");
const path = require("path");
// dotenv.config({ path: "../config.env" });
dotenv.config({ path: path.resolve(__dirname, "../config.env") });

console.log(process.env.NODE_ENV);
const express = require("express");
const cors = require("cors");
const compression = require("compression");

const morgan = require("morgan");
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
app.use(compression());
app.post(
  "/webhook-checkout",
  express.raw({ type: "application/json" }),
  webhookCheckout
);
// checkout webhook
app.use(express.json());
app.use(express.static(path.join(__dirname, "../uploads")));

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
