import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/db.js'

export class WithdrawalItem extends Model {}

WithdrawalItem.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    withdrawalRecordId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'withdrawal_record_id',
    },
    equipmentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'equipment_id',
    },
    barcode: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    unit: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'WithdrawalItem',
    tableName: 'withdrawal_items',
    timestamps: false,
  },
)
