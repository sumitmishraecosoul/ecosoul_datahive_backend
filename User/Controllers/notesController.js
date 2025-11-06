import sequelize from '../../Utils/dbConnection.js';
import Note from '../../Models/note.js';

const notesController = {};

notesController.create = async (req, res) => {
  try {
    const userId = req.userId;
    const { title, content } = req.body || {};
    const isContentString = typeof content === 'string';
    const shouldTruncate = isContentString && content.length > 1000;
    const contentToSave = shouldTruncate ? content.slice(0, 1000) : content;

    const result = await sequelize.transaction(async (t) => {
      const existing = await Note.findAll({
        where: { userId },
        attributes: ['id'],
        transaction: t,
        lock: t.LOCK.UPDATE
      });
      if (existing.length >= 10) {
        throw Object.assign(new Error('note_limit_reached'), { status: 409, payload: { error: 'limit_reached', message: 'Maximum of 10 notes reached' } });
      }

      const created = await Note.create({ userId, title, content: contentToSave }, { transaction: t });
      return created;
    });

    if (shouldTruncate) {
      res.set('X-Content-Limit', 'truncated');
    }
    return res.status(201).json(result);
  } catch (error) {
    if (error && error.status && error.payload) {
      return res.status(error.status).json(error.payload);
    }
    return res.status(500).json({ message: 'Error creating note', error: error.message });
  }
};

notesController.list = async (req, res) => {
  try {
    const userId = req.userId;
    const limitRaw = req.query.limit;
    const offsetRaw = req.query.offset;
    const parsedLimit = parseInt(limitRaw, 10);
    const parsedOffset = parseInt(offsetRaw, 10);
    const limit = Number.isNaN(parsedLimit) ? 50 : parsedLimit;
    const offset = Number.isNaN(parsedOffset) ? 0 : parsedOffset;

    const notes = await Note.findAll({
      where: { userId },
      order: [['updatedAt', 'DESC']],
      limit,
      offset
    });
    return res.status(200).json(notes);
  } catch (error) {
    return res.status(500).json({ message: 'Error listing notes', error: error.message });
  }
};

notesController.getOne = async (req, res) => {
  try {
    const userId = req.userId;
    const id = (req.body?.id) || req.query.id;
    const note = await Note.findOne({ where: { id, userId } });
    if (!note) {
      return res.status(404).json({ error: 'not_found', message: 'Note not found' });
    }
    return res.status(200).json(note);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching note', error: error.message });
  }
};

notesController.update = async (req, res) => {
  try {
    const userId = req.userId;
    const id = (req.body?.id) || req.query.id;
    const { title, content } = req.body || {};
    const isContentString = typeof content === 'string';
    const shouldTruncate = isContentString && content.length > 1000;
    const contentToSave = shouldTruncate ? content.slice(0, 1000) : content;

    const note = await Note.findOne({ where: { id, userId } });
    if (!note) {
      return res.status(404).json({ error: 'not_found', message: 'Note not found' });
    }

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = contentToSave;
    await note.save();

    if (shouldTruncate) {
      res.set('X-Content-Limit', 'truncated');
    }
    return res.status(200).json(note);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating note', error: error.message });
  }
};

notesController.remove = async (req, res) => {
  try {
    const userId = req.userId;
    const id = (req.body?.id) || req.query.id;
    const deleted = await Note.destroy({ where: { id, userId } });
    if (!deleted) {
      return res.status(404).json({ error: 'not_found', message: 'Note not found' });
    }
    return res.status(204).send({message: 'Note deleted successfully'});
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting note', error: error.message });
  }
};

export default notesController;


