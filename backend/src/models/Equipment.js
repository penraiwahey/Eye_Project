import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/db.js'

export class Equipment extends Model {
  toJSONSafe() {
    const json = this.toJSON()
    json.isLowStock = json.stockQty <= json.lowStockThreshold
    return json
  }
}

Equipment.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    barcode: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    compatibleModels: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'compatible_models',
    },
    unit: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'ชิ้น',
    },
    stockQty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'stock_qty',
    },
    lowStockThreshold: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
      field: 'low_stock_threshold',
    },
  },
  {
    sequelize,
    modelName: 'Equipment',
    tableName: 'equipment',
    timestamps: true,
  },
)
