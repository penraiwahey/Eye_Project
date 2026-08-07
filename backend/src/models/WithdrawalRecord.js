import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/db.js'

export class WithdrawalRecord extends Model {}

WithdrawalRecord.init(
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
    technicianId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'technician_id',
    },
    totalItems: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'total_items',
    },
    voided: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    voidedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'voided_at',
    },
    voidReason: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'void_reason',
    },
  },
  {
    sequelize,
    modelName: 'WithdrawalRecord',
    tableName: 'withdrawal_records',
    timestamps: true,
    updatedAt: false,
  },
)
