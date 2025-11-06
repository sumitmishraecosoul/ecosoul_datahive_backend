import { DataTypes } from '@sequelize/core';
import sequelize from '../Utils/dbConnection.js';
import User from './user.js';

const Note = sequelize.define('Note', {
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  }
}, {
  tableName: 'Notes',
  indexes: [
    {
      name: 'notes_user_updated_idx',
      fields: ['userId', 'updatedAt']
    },
    {
      name: 'notes_user_id_idx',
      fields: ['userId', 'id']
    }
  ]
});

Note.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Note, { foreignKey: 'userId', as: 'notes' });

export default Note;


