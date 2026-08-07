import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/db.js'

export class StockReceipt extends Model {}

StockReceipt.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    receiptNo: {
      type: DataTypes.STRING(40),
      allowNull: false,
      unique: true,
      field: 'receipt_no',
    },
    note: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    totalItems: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'total_items',
    },
    createdByUserId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'created_by_user_id',
    },
  },
  {
    sequelize,
    modelName: 'StockReceipt',
    tableName: 'stock_receipts',
    timestamps: true,
    updatedAt: false,
  },
)
