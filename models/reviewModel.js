const mongoose = require("mongoose");
const Product = require("./productModel");

const reviewSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    ratings: {
      type: Number,
      min: [1, "Min ratings value is 1.0"],
      max: [5, "Max ratings value is 5.0"],
      required: [true, "review ratings required"],
    },
    // parent reference
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to user"],
    },
    // parent reference (one to many)
    product: {
      type: mongoose.Schema.ObjectId,
      ref: "Product",
      required: [true, "Review must belong to product"],
    },
  },
  { timestamps: true }
);

reviewSchema.pre(/^find/, function (next) {
  this.populate({ path: "user", select: "name" });
  next();
});
reviewSchema.statics.calcAvgRatingsAndQuantity = async function (productId) {
  const result = await this.aggregate([
    //stage 1 : get all reviews in specific product
    {
      $match: { product: productId },
    },
    //stage 2 : group all reviews by product Id and calculate avg rating and quantity
    {
      $group: {
        _id: "$product",
        nRating: { $sum: 1 },
        avgRatings: { $avg: "$ratings" },
      },
    },
  ]);
  //
  if (result.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratingsQuantity: result[0].nRating,
      ratingsAverage: result[0].avgRatings,
    });
    console.log("happend");
  } else {
    await Product.findByIdAndUpdate(productId, {
      ratingsQuantity: 0,
      ratingsAverage: 0,
    });
  }
};

reviewSchema.post("save", async function () {
  await this.constructor.calcAvgRatingsAndQuantity(this.product);
});
// for remove
reviewSchema.post("remove", async function () {
  await this.constructor.calcAvgRatingsAndQuantity(this.product);
});
// when make update
module.exports = mongoose.model("Review", reviewSchema);
