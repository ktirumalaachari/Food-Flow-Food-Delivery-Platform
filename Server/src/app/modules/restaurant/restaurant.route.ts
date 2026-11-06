import express, { Router } from 'express';
import { RestaurantController } from './restaurant.controller';

const router: Router = express.Router();

/**
 * Restaurant & Vendor Management Routes (/api/restaurants)
 */

// 1. Logged-in Restaurant Owner Profile Management
router.get('/my-profile', RestaurantController.getMyProfile);
router.patch('/my-profile', RestaurantController.updateMyProfile);
router.patch('/toggle-status', RestaurantController.toggleStatus);

// 2. Secret Recipe & Grocery Smart Management
router.get('/grocery/food/:foodId', RestaurantController.getFoodItemDetails);
router.get('/grocery/:restaurantId', RestaurantController.getRestaurantGroceryItems);
router.post('/grocery/aggregate', RestaurantController.aggregateGroceryList);
router.patch('/grocery/food/:foodId/recipe', RestaurantController.updateFoodSecretRecipe);

// 3. Restaurant Menu Items Management
router.post('/food', RestaurantController.addFoodItem);
router.get('/food/:restaurantId', RestaurantController.getRestaurantMenu);
router.get('/food/item/:foodId', RestaurantController.getFoodItemDetails);
router.patch('/food/:foodId/status', RestaurantController.toggleFoodAvailability);
router.patch('/food/:foodId', RestaurantController.updateFoodItem);
router.delete('/food/:foodId', RestaurantController.deleteFoodItem);

// 4. Restaurant Exploration & Single Profile
router.post('/', RestaurantController.createRestaurant);
router.get('/', RestaurantController.getAllRestaurants);
router.get('/:id', RestaurantController.getSingleRestaurant);

export const RestaurantRoutes = router;
