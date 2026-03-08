import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { timestamps: true }
);

reviewSchema.index({ product: 1, user: 1 }, { unique: true });

reviewSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;

    if (ret.user && ret.user._id) {
      ret.user = {
        id: ret.user._id.toString(),
        name: ret.user.name,
      };
    }

    if (ret.product && ret.product._id) {
      ret.product = ret.product._id.toString();
    }

    return ret;
  },
});

export default mongoose.model("Review", reviewSchema);