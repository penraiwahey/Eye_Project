import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/db.js'

export class StockReceiptItem extends Model {}

StockReceiptItem.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    stockReceiptId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'stock_receipt_id',
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
    modelName: 'StockReceiptItem',
    tableName: 'stock_receipt_items',
    timestamps: false,
  },
)
