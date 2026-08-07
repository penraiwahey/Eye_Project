import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/db.js'

export class Technician extends Model {}

Technician.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'Technician',
    tableName: 'technicians',
    timestamps: true,
  },
)
