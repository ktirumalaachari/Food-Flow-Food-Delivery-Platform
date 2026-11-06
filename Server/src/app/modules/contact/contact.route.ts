import express, { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { contactCollection } from '../../config/db';

const router: Router = express.Router();

/**
 * Contact Message Management Routes (/api/contacts and /api/contact)
 */

// 1. Submit contact form message
router.post('/', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const ticketId = payload.ticketId || `FF-${Math.floor(1000 + Math.random() * 9000)}`;

    const newContact = {
      ...payload,
      ticketId,
      status: 'pending',
      replies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await contactCollection.insertOne(newContact);
    res.status(201).json({
      success: true,
      message: 'Support ticket submitted successfully',
      data: { ...newContact, _id: result.insertedId },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to submit contact message',
    });
  }
});

// 2. Get contact stats overview
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [total, pending, inProgress, replied, resolved] = await Promise.all([
      contactCollection.countDocuments({}),
      contactCollection.countDocuments({ status: 'pending' }),
      contactCollection.countDocuments({ status: 'in-progress' }),
      contactCollection.countDocuments({ status: 'replied' }),
      contactCollection.countDocuments({ status: 'resolved' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        inProgress,
        replied,
        resolved,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to fetch contact stats',
    });
  }
});

// 3. Get all contact messages with search, filter, pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, category, search, page = '1', limit = '10' } = req.query;

    const query: any = {};
    if (status && status !== 'all') query.status = status;
    if (category && category !== 'all') query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: String(search), $options: 'i' } },
        { email: { $regex: String(search), $options: 'i' } },
        { subject: { $regex: String(search), $options: 'i' } },
        { ticketId: { $regex: String(search), $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      contactCollection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .toArray(),
      contactCollection.countDocuments(query),
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
      message: error?.message || 'Failed to fetch contact messages',
      data: [],
    });
  }
});

// 4. Get single contact message
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const filter = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { ticketId: id }] }
      : { ticketId: id };

    const contact = await contactCollection.findOne(filter as any);
    if (!contact) {
      res.status(404).json({ success: false, message: 'Message not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to fetch contact message',
    });
  }
});

// 5. Reply to contact message
router.post('/:id/reply', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { replyMessage, repliedBy } = req.body;

    const filter = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { ticketId: id }] }
      : { ticketId: id };

    const reply = {
      id: `rep-${Date.now()}`,
      replyMessage,
      repliedBy: repliedBy || 'Support Team',
      repliedAt: new Date(),
    };

    const updated = await contactCollection.findOneAndUpdate(
      filter as any,
      {
        $push: { replies: reply } as any,
        $set: { status: 'replied', updatedAt: new Date() },
      },
      { returnDocument: 'after' }
    );

    res.status(200).json({
      success: true,
      message: 'Reply saved',
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to save reply',
    });
  }
});

// 6. Update status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const filter = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { ticketId: id }] }
      : { ticketId: id };

    const updated = await contactCollection.findOneAndUpdate(
      filter as any,
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    res.status(200).json({
      success: true,
      message: 'Status updated',
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to update status',
    });
  }
});

// 7. Delete contact message
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const filter = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { ticketId: id }] }
      : { ticketId: id };

    await contactCollection.deleteOne(filter as any);
    res.status(200).json({
      success: true,
      message: 'Message deleted',
      data: { id },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to delete message',
    });
  }
});

export const ContactRoutes = router;
