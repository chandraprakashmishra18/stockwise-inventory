const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  sku: { type: String, required: true, trim: true, uppercase: true, maxlength: 40, unique: true },
  category: { type: String, required: true, trim: true, maxlength: 60, index: true },
  price: { type: Number, required: true, min: 0, validate: Number.isFinite },
  quantity: { type: Number, required: true, min: 0, validate: Number.isInteger },
  reorderLevel: { type: Number, required: true, min: 0, validate: Number.isInteger },
  supplier: { type: String, required: true, trim: true, maxlength: 120 },
}, {
  timestamps: true,
  toJSON: { virtuals: true, versionKey: false },
  toObject: { virtuals: true },
});

productSchema.virtual("stockValue").get(function stockValue() {
  return Math.round(this.price * this.quantity * 100) / 100;
});

productSchema.index({ name: "text", sku: "text", supplier: "text" });

module.exports = mongoose.model("Product", productSchema);
