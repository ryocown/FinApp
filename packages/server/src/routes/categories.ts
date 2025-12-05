import { Router, type Request, type Response } from 'express';
import { getCategoriesRef } from '../firebase';
import { type ICategory } from '../../../shared/models/category';

import { CategorySchema } from '../schemas';
import { validate } from '../middleware/validate';

const router = Router();

// Get all categories
router.get('/', async (req: Request, res: Response) => {
  try {
    const snapshot = await getCategoriesRef().get();
    const categories = snapshot.docs.map(doc => Object.assign({}, doc.data(), { categoryId: doc.id }));
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create a category
router.post('/', validate(CategorySchema), async (req: Request, res: Response) => {
  try {
    const category: ICategory = req.body;
    const docRef = await getCategoriesRef().add(category);
    res.status(201).json(Object.assign({}, category, { categoryId: docRef.id }));
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

export default router;
