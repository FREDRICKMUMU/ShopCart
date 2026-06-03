import { getFlashDeals, getProduct, getProducts, updateProduct, createProduct, deleteProduct } from '../controllers/productController.js';
import express from 'express';
import auth from '../middleware/auth.js';
import admin from '../middleware/admin.js';

const productRouter = express.Router();

productRouter.get("/flash-deals", getFlashDeals);
productRouter.get("/", getProducts);
productRouter.get("/:id", getProduct);
productRouter.post("/", auth, admin, createProduct);
productRouter.put("/:id", auth, admin, updateProduct);
productRouter.delete("/:id", auth, admin, deleteProduct);

export default productRouter;