const mongoose = require("mongoose");
const Product = require("../models/Product");
const { validateProductInput } = require("../validators/products");

const sortableFields = new Set(["name", "sku", "category", "price", "quantity", "reorderLevel", "createdAt"]);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const notFound = (res) => res.status(404).json({ error: "Product not found." });
const validId = (id) => mongoose.isValidObjectId(id);

async function listProducts(req, res, next) {
  try {
    const page = Math.max(1, Math.min(100000, Number.parseInt(req.query.page, 10) || 1));
    const limit = Math.max(1, Math.min(100, Number.parseInt(req.query.limit, 10) || 20));
    const sortBy = sortableFields.has(req.query.sortBy) ? req.query.sortBy : "createdAt";
    const direction = req.query.order === "asc" ? 1 : -1;
    const filter = {};
    if (typeof req.query.category === "string" && req.query.category.trim()) filter.category = req.query.category.trim();
    if (typeof req.query.search === "string" && req.query.search.trim()) {
      const pattern = new RegExp(escapeRegex(req.query.search.trim().slice(0, 80)), "i");
      filter.$or = [{ name: pattern }, { sku: pattern }, { supplier: pattern }];
    }
    if (req.query.stock === "low") filter.$expr = { $lte: ["$quantity", "$reorderLevel"] };

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ [sortBy]: direction, _id: 1 }).skip((page - 1) * limit).limit(limit).lean({ virtuals: true }),
      Product.countDocuments(filter),
    ]);
    res.json({ products, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
}

async function getSummary(_req, res, next) {
  try {
    const [result] = await Product.aggregate([{ $facet: {
      totals: [{ $group: { _id: null, products: { $sum: 1 }, units: { $sum: "$quantity" }, stockValue: { $sum: { $multiply: ["$price", "$quantity"] } } } }],
      lowStock: [{ $match: { $expr: { $lte: ["$quantity", "$reorderLevel"] } } }, { $count: "count" }],
      categories: [{ $group: { _id: "$category", products: { $sum: 1 }, units: { $sum: "$quantity" }, stockValue: { $sum: { $multiply: ["$price", "$quantity"] } } } }, { $sort: { _id: 1 } }],
    } }]);
    const totals = result.totals[0] || { products: 0, units: 0, stockValue: 0 };
    res.json({ ...totals, stockValue: Math.round(totals.stockValue * 100) / 100, lowStock: result.lowStock[0]?.count || 0, categories: result.categories });
  } catch (error) { next(error); }
}

async function getLowStock(_req, res, next) {
  try {
    const products = await Product.find({ $expr: { $lte: ["$quantity", "$reorderLevel"] } }).sort({ quantity: 1, name: 1 });
    res.json({ products, total: products.length });
  } catch (error) { next(error); }
}

async function createProduct(req, res, next) {
  const { data, errors } = validateProductInput(req.body);
  if (errors.length) return res.status(400).json({ error: "Check the product details.", details: errors });
  try {
    const product = await Product.create(data);
    res.status(201).json(product);
  } catch (error) { next(error); }
}

async function getProduct(req, res, next) {
  if (!validId(req.params.id)) return res.status(400).json({ error: "The supplied product ID is invalid." });
  try {
    const product = await Product.findById(req.params.id);
    return product ? res.json(product) : notFound(res);
  } catch (error) { next(error); }
}

async function updateProduct(req, res, next) {
  if (!validId(req.params.id)) return res.status(400).json({ error: "The supplied product ID is invalid." });
  const { data, errors } = validateProductInput(req.body, { partial: true });
  if (errors.length) return res.status(400).json({ error: "Check the product details.", details: errors });
  if (data.sku) data.sku = data.sku.toUpperCase();
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { $set: data }, { new: true, runValidators: true });
    return product ? res.json(product) : notFound(res);
  } catch (error) { next(error); }
}

async function adjustStock(req, res, next) {
  if (!validId(req.params.id)) return res.status(400).json({ error: "The supplied product ID is invalid." });
  const change = Number(req.body?.change);
  if (!Number.isInteger(change) || change === 0) return res.status(400).json({ error: "change must be a non-zero integer." });
  try {
    const condition = { _id: req.params.id };
    if (change < 0) condition.quantity = { $gte: Math.abs(change) };
    const product = await Product.findOneAndUpdate(condition, { $inc: { quantity: change } }, { new: true, runValidators: true });
    if (product) return res.json({ product });
    const exists = await Product.exists({ _id: req.params.id });
    return exists ? res.status(409).json({ error: "There is not enough stock for this adjustment." }) : notFound(res);
  } catch (error) { next(error); }
}

async function deleteProduct(req, res, next) {
  if (!validId(req.params.id)) return res.status(400).json({ error: "The supplied product ID is invalid." });
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    return product ? res.status(204).end() : notFound(res);
  } catch (error) { next(error); }
}

module.exports = { listProducts, getSummary, getLowStock, createProduct, getProduct, updateProduct, adjustStock, deleteProduct };
