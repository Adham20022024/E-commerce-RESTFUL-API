const xss = require("xss");

exports.sanitizeInput = (req, res, next) => {
  console.log(req.body);
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === "string") {
        console.log(`Before sanitization: ${req.body[key]}`); // Check before sanitization
        req.body[key] = xss(req.body[key]);
        console.log(`After sanitization: ${req.body[key]}`); // Check after sanitization
      }
    });
  }
  next();
};
