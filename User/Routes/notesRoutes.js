import express from 'express';
import notesController from '../Controllers/notesController.js';
import tokenVerify from '../Middleware/tokenVerify.js';
const router = express.Router();

/**
 * @swagger
 * /notes/createNote:
 *   post:
 *     tags:
 *       - Notes
 *     summary: Create a note
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title: { type: string, maxLength: 200 }
 *               content: { type: string }
 *     responses:
 *       201: { description: Note created }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       409: { description: Limit reached }
 */
router.post('/createNote', tokenVerify,notesController.create);

/**
 * @swagger
 * /notes/getAllNotes:
 *   get:
 *     tags:
 *       - Notes
 *     summary: List notes for the authenticated user
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, minimum: 0 }
 *     responses:
 *       200: { description: Notes fetched }
 *       401: { description: Unauthorized }
 */
router.get('/getAllNotes', tokenVerify, notesController.list);

/**
 * @swagger
 * /notes/getNoteById:
 *   get:
 *     tags:
 *       - Notes
 *     summary: Get a single note by id
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Note fetched }
 *       401: { description: Unauthorized }
 *       404: { description: Not found }
 */
router.get('/getNoteById', tokenVerify, notesController.getOne);

/**
 * @swagger
 * /notes/updateNote:
 *   patch:
 *     tags:
 *       - Notes
 *     summary: Update a note
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, maxLength: 200 }
 *               content: { type: string }
 *     responses:
 *       200: { description: Note updated }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       404: { description: Not found }
 */
router.patch('/updateNote', tokenVerify, notesController.update);

/**
 * @swagger
 * /notes/deleteNote:
 *   delete:
 *     tags:
 *       - Notes
 *     summary: Delete a note
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Note deleted }
 *       401: { description: Unauthorized }
 *       404: { description: Not found }
 */
router.delete('/deleteNote', tokenVerify, notesController.remove);

export default router;


