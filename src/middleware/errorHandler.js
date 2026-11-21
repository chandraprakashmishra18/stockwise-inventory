function errorHandler(error, _req, res, _next) {
  if (error?.code === 11000) {
    return res.status(409).json({ error: "A product with this SKU already exists." });
  }
  if (error?.name === "ValidationError") {
    return res.status(400).json({ error: "Product data failed validation.", details: Object.values(error.errors).map((item) => item.message) });
  }
  if (error?.name === "CastError") {
    return res.status(400).json({ error: "The supplied product ID is invalid." });
  }
  const status = Number.isInteger(error?.status) ? error.status : 500;
  const message = status >= 500 ? "The server could not complete the request." : error.message;
  if (status >= 500) console.error(error);
  return res.status(status).json({ error: message });
}

module.exports = errorHandler;
