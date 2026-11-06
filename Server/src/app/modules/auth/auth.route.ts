import express, { Router, Request, Response } from 'express';
import { usersCollection } from '../../config/db';

const router: Router = express.Router();

/**
 * Auth Helper Routes (/api/auth)
 */

router.get('/ping', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Auth service active' });
});

export const AuthRoutes = router;
