import { DataTypes } from '@sequelize/core';
import sequelize from '../Utils/dbConnection.js';
import Department from './department.js';

const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  department: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Department,
      key: 'id'
    }
  }
});

// Associations
// A User belongs to a Department via the 'department' foreign key
// Defining association to help Sequelize understand FK relationships on sync
User.belongsTo(Department, { foreignKey: 'department', as: 'departmentInfo' });

export default User;