import express, { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { cartCollection } from '../../config/db';

const router: Router = express.Router();

/**
 * Cart Management Routes (/api/cart)
 */

// 1. Get user cart
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const cart = await cartCollection.findOne({
      $or: [{ userId }, { userEmail: req.headers['x-user-email'] }],
    });

    res.status(200).json({
      success: true,
      data: cart || { items: [], totalAmount: 0 },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to fetch cart',
    });
  }
});

// 2. Add item to cart
router.post('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const item = req.body;
    const userEmail = (req.headers['x-user-email'] as string) || req.body.userEmail;

    const existingCart = await cartCollection.findOne({
      $or: [{ userId }, { userEmail }],
    });

    let items = existingCart?.items || [];
    const itemIndex = items.findIndex((i: any) => String(i.foodId) === String(item.foodId));

    if (itemIndex > -1) {
      items[itemIndex].quantity = (items[itemIndex].quantity || 1) + (item.quantity || 1);
    } else {
      items.push({
        ...item,
        quantity: item.quantity || 1,
        addedAt: new Date(),
      });
    }

    const totalAmount = items.reduce(
      (sum: number, i: any) => sum + Number(i.price || 0) * Number(i.quantity || 1),
      0
    );

    const updated = await cartCollection.findOneAndUpdate(
      { $or: [{ userId }, { userEmail }] },
      {
        $set: {
          userId,
          userEmail,
          items,
          totalAmount,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, returnDocument: 'after' }
    );

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to add item to cart',
    });
  }
});

// 3. Update item quantity (with delta)
router.patch('/:userId/:foodId', async (req: Request, res: Response) => {
  try {
    const { userId, foodId } = req.params;
    const delta = Number(req.body.delta) || 0;
    const userEmail = req.headers['x-user-email'] as string;

    const cart = await cartCollection.findOne({
      $or: [{ userId }, { userEmail }],
    });

    if (!cart) {
      res.status(404).json({ success: false, message: 'Cart not found' });
      return;
    }

    let items = (cart.items || [])
      .map((i: any) => {
        if (String(i.foodId) === String(foodId)) {
          const newQty = (Number(i.quantity) || 1) + delta;
          return newQty > 0 ? { ...i, quantity: newQty } : null;
        }
        return i;
      })
      .filter(Boolean);

    const totalAmount = items.reduce(
      (sum: number, i: any) => sum + Number(i.price || 0) * Number(i.quantity || 1),
      0
    );

    const updated = await cartCollection.findOneAndUpdate(
      { _id: cart._id },
      {
        $set: {
          items,
          totalAmount,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    res.status(200).json({
      success: true,
      message: 'Cart updated',
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to update cart',
    });
  }
});

// 4. Remove item from cart
router.delete('/:userId/:foodId', async (req: Request, res: Response) => {
  try {
    const { userId, foodId } = req.params;
    const userEmail = req.headers['x-user-email'] as string;

    const cart = await cartCollection.findOne({
      $or: [{ userId }, { userEmail }],
    });

    if (!cart) {
      res.status(404).json({ success: false, message: 'Cart not found' });
      return;
    }

    const items = (cart.items || []).filter((i: any) => String(i.foodId) !== String(foodId));
    const totalAmount = items.reduce(
      (sum: number, i: any) => sum + Number(i.price || 0) * Number(i.quantity || 1),
      0
    );

    const updated = await cartCollection.findOneAndUpdate(
      { _id: cart._id },
      { $set: { items, totalAmount, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to remove item',
    });
  }
});

// 5. Clear cart
router.delete('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userEmail = req.headers['x-user-email'] as string;

    await cartCollection.deleteOne({
      $or: [{ userId }, { userEmail }],
    });

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to clear cart',
    });
  }
});

export const CartRoutes = router;
