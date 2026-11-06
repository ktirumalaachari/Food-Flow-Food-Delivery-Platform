import express, { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { couponsCollection } from '../../config/db';

const router: Router = express.Router();

/**
 * Coupon Management Routes (/api/coupons)
 */

// 1. Get coupons
router.get('/', async (req: Request, res: Response) => {
  try {
    const { mode } = req.query;
    const now = new Date();

    const query: any = {};
    if (mode === 'active') {
      query.isActive = true;
      query.$or = [{ expiryDate: { $exists: false } }, { expiryDate: { $gte: now.toISOString() } }];
    }

    const coupons = await couponsCollection.find(query).toArray();
    res.status(200).json({
      success: true,
      data: coupons,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to fetch coupons',
      data: [],
    });
  }
});

// 2. Create coupon
router.post('/', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload.code) {
      res.status(400).json({ success: false, message: 'Coupon code is required' });
      return;
    }

    const newCoupon = {
      ...payload,
      code: payload.code.toUpperCase().trim(),
      isActive: payload.isActive ?? true,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await couponsCollection.insertOne(newCoupon);
    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: { ...newCoupon, _id: result.insertedId },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to create coupon',
    });
  }
});

// 3. Apply coupon
router.post('/apply', async (req: Request, res: Response) => {
  try {
    const { code, orderAmount = 0 } = req.body;
    if (!code) {
      res.status(400).json({ success: false, message: 'Coupon code required' });
      return;
    }

    const coupon = await couponsCollection.findOne({
      code: String(code).toUpperCase().trim(),
      isActive: true,
    });

    if (!coupon) {
      res.status(404).json({ success: false, message: 'Invalid or inactive coupon code' });
      return;
    }

    if (coupon.minOrderValue && Number(orderAmount) < Number(coupon.minOrderValue)) {
      res.status(400).json({
        success: false,
        message: `Minimum order value for this coupon is ₹${coupon.minOrderValue}`,
      });
      return;
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (Number(orderAmount) * Number(coupon.discountValue)) / 100;
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountAmount));
      }
    } else {
      discountAmount = Number(coupon.discountValue);
    }

    res.status(200).json({
      success: true,
      code: coupon.code,
      discountAmount: Math.round(discountAmount),
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      message: 'Coupon applied successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to apply coupon',
    });
  }
});

export const CouponRoutes = router;
