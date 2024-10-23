const mongoose = require("mongoose");

const dbConnection = () => {
  const DB = process.env.DATABASE.replace(
    "<PASSWORD>",
    process.env.DATABASE_PASSWORD
  );
  mongoose.set("strictQuery", true);
  mongoose.connect(DB, {}).then((conn) => {
    console.log(`DB Connection successful 🥳 ${conn.connection.host}`);
  });
};
module.exports = dbConnection;
