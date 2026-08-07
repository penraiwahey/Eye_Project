import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/db.js'

export class EquipmentImport extends Model {}

EquipmentImport.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'file_name',
    },
    createdCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'created_count',
    },
    updatedCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'updated_count',
    },
    errorCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'error_count',
    },
    errors: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdByUserId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'created_by_user_id',
    },
  },
  {
    sequelize,
    modelName: 'EquipmentImport',
    tableName: 'equipment_imports',
    timestamps: true,
    updatedAt: false,
  },
)
