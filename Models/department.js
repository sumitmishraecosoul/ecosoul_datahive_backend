import { DataTypes } from '@sequelize/core';
import sequelize from '../Utils/dbConnection.js';

const Department = sequelize.define('Department', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

export default Department;