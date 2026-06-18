import { Router } from 'express'
import { protect, authorize } from '../middleware/auth.js'
import {
  listContent, getContent, createContent, updateContent, deleteContent,
} from '../controllers/contentController.js'

const r = Router()
r.use(protect)

const editors = authorize('super_admin', 'principal', 'community_admin')

r.get('/', listContent)
r.get('/:id', getContent)
r.post('/', editors, createContent)
r.patch('/:id', editors, updateContent)
r.delete('/:id', editors, deleteContent)

export default r
