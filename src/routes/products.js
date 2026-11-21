const express = require("express");
const controller = require("../controllers/products");

const router = express.Router();
router.get("/summary", controller.getSummary);
router.get("/low-stock", controller.getLowStock);
router.get("/", controller.listProducts);
router.post("/", controller.createProduct);
router.get("/:id", controller.getProduct);
router.put("/:id", controller.updateProduct);
router.patch("/:id/stock", controller.adjustStock);
router.delete("/:id", controller.deleteProduct);

module.exports = router;
