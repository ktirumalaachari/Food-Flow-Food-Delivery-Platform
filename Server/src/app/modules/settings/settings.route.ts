import express, { Router, Request, Response } from 'express';
import { settingsCollection } from '../../config/db';

const router: Router = express.Router();

const DEFAULT_SETTINGS = {
  vatPercentage: 5,
  restaurantCommissionPercentage: 15,
  deliveryFeeBase: 30,
  riderCommissionPercentage: 80,
  freeDeliveryThreshold: 500,
};

/**
 * Platform Settings Routes (/api/settings)
 */

router.get('/', async (req: Request, res: Response) => {
  try {
    const settings = await settingsCollection.findOne({});
    res.status(200).json({
      success: true,
      data: settings ? { ...DEFAULT_SETTINGS, ...settings } : DEFAULT_SETTINGS,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to fetch settings',
      data: DEFAULT_SETTINGS,
    });
  }
});

router.put('/', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const updated = await settingsCollection.findOneAndUpdate(
      {},
      { $set: { ...payload, updatedAt: new Date() } },
      { upsert: true, returnDocument: 'after' }
    );

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to update settings',
    });
  }
});

export const SettingsRoutes = router;
