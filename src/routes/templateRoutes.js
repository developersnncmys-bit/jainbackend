import { Router } from 'express'
import { protect, authorize } from '../middleware/auth.js'
import {
  listTemplates, createTemplate, updateTemplate, deleteTemplate,
} from '../controllers/templateController.js'

const r = Router()
r.use(protect)

r.get('/', listTemplates)
r.post('/', authorize('super_admin'), createTemplate)
r.patch('/:id', authorize('super_admin'), updateTemplate)
r.delete('/:id', authorize('super_admin'), deleteTemplate)

export default r
