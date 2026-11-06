import express, { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { riderCollection } from '../../config/db';

const router: Router = express.Router();

/**
 * Rider Management Routes (/api/rider)
 */

// 1. Get my rider profile
router.get('/my-profile', async (req: Request, res: Response) => {
  try {
    const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);

    if (!email && !userId) {
      res.status(400).json({ success: false, message: 'Rider email or user ID required' });
      return;
    }

    const query: any = {};
    if (email) query.email = email;
    if (userId) query.userId = userId;

    const rider = await riderCollection.findOne(query);

    res.status(200).json({
      success: true,
      data: rider,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to fetch rider profile',
    });
  }
});

// 2. Get all riders
router.get('/all', async (req: Request, res: Response) => {
  try {
    const riders = await riderCollection.find({}).toArray();
    res.status(200).json({
      success: true,
      data: riders,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to fetch riders',
      data: [],
    });
  }
});

// 3. Create rider profile
router.post('/profile', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const email = payload.email || req.headers['x-user-email'];

    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }

    const result = await riderCollection.findOneAndUpdate(
      { email },
      {
        $set: {
          ...payload,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          status: 'pending',
          isAvailable: false,
          totalDeliveries: 0,
          rating: 5,
          totalEarnings: 0,
          createdAt: new Date(),
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    res.status(201).json({
      success: true,
      message: 'Rider profile registered successfully',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to save rider profile',
    });
  }
});

// 4. Update rider profile
router.patch('/profile', async (req: Request, res: Response) => {
  try {
    const email = (req.query.email as string) || req.body.email || (req.headers['x-user-email'] as string);
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }

    const result = await riderCollection.findOneAndUpdate(
      { email },
      { $set: { ...req.body, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    res.status(200).json({
      success: true,
      message: 'Rider profile updated successfully',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to update rider profile',
    });
  }
});

// 5. Toggle rider availability
router.patch('/profile/availability', async (req: Request, res: Response) => {
  try {
    const { email, isAvailable } = req.body;
    const targetEmail = email || (req.headers['x-user-email'] as string);

    const result = await riderCollection.findOneAndUpdate(
      { email: targetEmail },
      { $set: { isAvailable: Boolean(isAvailable), updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    res.status(200).json({
      success: true,
      message: `Rider is now ${isAvailable ? 'Available' : 'Offline'}`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to update rider availability',
    });
  }
});

// 6. Delete rider profile
router.delete('/profile', async (req: Request, res: Response) => {
  try {
    const email = req.body.email || (req.headers['x-user-email'] as string);
    const result = await riderCollection.deleteOne({ email });

    res.status(200).json({
      success: true,
      message: 'Rider profile deleted',
      data: { deletedCount: result.deletedCount },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to delete rider profile',
    });
  }
});

export const RiderRoutes = router;
