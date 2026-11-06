import express, { Router } from 'express';
import { FoodController } from './food.controller';

const router: Router = express.Router();

/**
 * Public & Global Food Item Routes (/api/food)
 */

// 1. Get Distinct Food Categories
router.get('/categories', FoodController.getDistinctCategories);

// 2. Get All Global Food Items (Search, Filter, Sort, GPS Radius Pruning, Pagination)
router.get('/', FoodController.getAllGlobalFoodItems);

export const FoodRoutes = router;
