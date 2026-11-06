import express, { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { addressCollection } from '../../config/db';

const router: Router = express.Router();

/**
 * Address Management Routes (/api/addresses)
 */

// 1. Get user addresses
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const userEmail = req.headers['x-user-email'] as string;

    const query: any = {};
    if (userId || userEmail) {
      query.$or = [];
      if (userId) query.$or.push({ userId });
      if (userEmail) query.$or.push({ userEmail });
    }

    const addresses = await addressCollection.find(query).toArray();
    res.status(200).json({
      success: true,
      data: addresses,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to fetch addresses',
    });
  }
});

// 2. Create address
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || req.body.userId;
    const userEmail = (req.headers['x-user-email'] as string) || req.body.userEmail;

    const newAddress = {
      ...req.body,
      userId,
      userEmail,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await addressCollection.insertOne(newAddress);
    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: { ...newAddress, _id: result.insertedId },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to add address',
    });
  }
});

// 3. Update address
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };

    const result = await addressCollection.findOneAndUpdate(
      filter as any,
      { $set: { ...req.body, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to update address',
    });
  }
});

// 4. Delete address
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };

    await addressCollection.deleteOne(filter as any);
    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to delete address',
    });
  }
});

// 5. Set default address
router.patch('/:id/default', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string;
    const userEmail = req.headers['x-user-email'] as string;

    const userFilter: any = {};
    if (userId || userEmail) {
      userFilter.$or = [];
      if (userId) userFilter.$or.push({ userId });
      if (userEmail) userFilter.$or.push({ userEmail });
    }

    // Unset other defaults
    if (userFilter.$or) {
      await addressCollection.updateMany(userFilter, { $set: { isDefault: false } });
    }

    const targetFilter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    const updated = await addressCollection.findOneAndUpdate(
      targetFilter as any,
      { $set: { isDefault: true, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    res.status(200).json({
      success: true,
      message: 'Default address updated',
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to set default address',
    });
  }
});

export const AddressRoutes = router;
