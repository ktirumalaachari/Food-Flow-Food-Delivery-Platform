import express, { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { categoryCollection } from '../../config/db';

const router: Router = express.Router();

/**
 * Category Management Routes (/api/categories)
 */

// 1. Get all categories
router.get('/', async (req: Request, res: Response) => {
  try {
    const isAll = req.query.all === 'true';
    const query = isAll ? {} : { isActive: { $ne: false } };

    const categories = await categoryCollection
      .find(query)
      .sort({ displayOrder: 1, name: 1 })
      .toArray();

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to fetch categories',
      data: [],
    });
  }
});

// 2. Create category
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, emoji, description, isActive = true, displayOrder = 0 } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: 'Category name is required' });
      return;
    }

    const slug = name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

    const newCategory = {
      name,
      slug,
      emoji: emoji || '🍽️',
      description: description || '',
      isActive: Boolean(isActive),
      displayOrder: Number(displayOrder),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await categoryCollection.insertOne(newCategory);
    res.status(201).json({
      success: true,
      message: 'Category created',
      data: { ...newCategory, _id: result.insertedId },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to create category',
    });
  }
});

// 3. Update category
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };

    const result = await categoryCollection.findOneAndUpdate(
      filter as any,
      { $set: { ...req.body, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    res.status(200).json({
      success: true,
      message: 'Category updated',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to update category',
    });
  }
});

// 4. Delete category
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };

    await categoryCollection.deleteOne(filter as any);
    res.status(200).json({
      success: true,
      message: 'Category deleted',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to delete category',
    });
  }
});

export const CategoryRoutes = router;
