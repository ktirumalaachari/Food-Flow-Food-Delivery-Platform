import express, { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { usersCollection, restaurantCollection, riderCollection } from '../../config/db';

const router: Router = express.Router();

/**
 * Admin Management Routes (/api/admin)
 */

// 1. Get admin stats for approvals
router.get('/restaurant-rider-stats', async (req: Request, res: Response) => {
  try {
    const [totalRestaurants, pendingRestaurants, activeRestaurants] = await Promise.all([
      restaurantCollection.countDocuments({}),
      restaurantCollection.countDocuments({ status: 'pending' }),
      restaurantCollection.countDocuments({ status: 'active' }),
    ]);

    const [totalRiders, pendingRiders, activeRiders] = await Promise.all([
      riderCollection.countDocuments({}),
      riderCollection.countDocuments({ status: 'pending' }),
      riderCollection.countDocuments({ status: 'active' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        restaurants: {
          total: totalRestaurants,
          pending: pendingRestaurants,
          active: activeRestaurants,
        },
        riders: {
          total: totalRiders,
          pending: pendingRiders,
          active: activeRiders,
        },
        totalPendingApprovals: pendingRestaurants + pendingRiders,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to fetch admin approval stats',
    });
  }
});

// 2. Get restaurants for admin
router.get('/restaurants', async (req: Request, res: Response) => {
  try {
    const { status, search, page = '1', limit = '10' } = req.query;
    const query: any = {};

    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { restaurantName: { $regex: String(search), $options: 'i' } },
        { ownerEmail: { $regex: String(search), $options: 'i' } },
        { ownerName: { $regex: String(search), $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      restaurantCollection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .toArray(),
      restaurantCollection.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: items,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to fetch admin restaurants',
      data: [],
    });
  }
});

// 3. Update restaurant status
router.patch('/restaurants/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    const updated = await restaurantCollection.findOneAndUpdate(
      filter as any,
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    res.status(200).json({
      success: true,
      message: `Restaurant status updated to ${status}`,
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to update restaurant status',
    });
  }
});

// 4. Delete restaurant
router.delete('/restaurants/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    await restaurantCollection.deleteOne(filter as any);

    res.status(200).json({
      success: true,
      message: 'Restaurant deleted successfully',
      data: { id },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to delete restaurant',
    });
  }
});

// 5. Get riders for admin
router.get('/riders', async (req: Request, res: Response) => {
  try {
    const { status, search, page = '1', limit = '10' } = req.query;
    const query: any = {};

    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: String(search), $options: 'i' } },
        { email: { $regex: String(search), $options: 'i' } },
        { phone: { $regex: String(search), $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      riderCollection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .toArray(),
      riderCollection.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: items,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to fetch admin riders',
      data: [],
    });
  }
});

// 6. Update rider status
router.patch('/riders/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    const updated = await riderCollection.findOneAndUpdate(
      filter as any,
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    res.status(200).json({
      success: true,
      message: `Rider status updated to ${status}`,
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to update rider status',
    });
  }
});

// 7. Delete rider
router.delete('/riders/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    await riderCollection.deleteOne(filter as any);

    res.status(200).json({
      success: true,
      message: 'Rider deleted successfully',
      data: { id },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to delete rider',
    });
  }
});

// 8. Get all users for admin
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { role, status, search, page = '1', limit = '10' } = req.query;
    const query: any = {};

    if (role && role !== 'all') query.role = { $regex: new RegExp(`^${role}$`, 'i') };
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: String(search), $options: 'i' } },
        { email: { $regex: String(search), $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      usersCollection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .toArray(),
      usersCollection.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: items,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to fetch users',
      data: [],
    });
  }
});

// 9. Update user role
router.patch('/users/:id/role', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id };
    const updated = await usersCollection.findOneAndUpdate(
      filter as any,
      { $set: { role, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      data: { id, role },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to update user role',
    });
  }
});

// 10. Update user status
router.patch('/users/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id };
    const updated = await usersCollection.findOneAndUpdate(
      filter as any,
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    res.status(200).json({
      success: true,
      message: `User status updated to ${status}`,
      data: { id, status },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to update user status',
    });
  }
});

// 11. Delete user
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id };
    await usersCollection.deleteOne(filter as any);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: { id },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to delete user',
    });
  }
});

export const AdminRoutes = router;
