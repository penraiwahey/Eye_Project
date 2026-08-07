import { User } from './User.js'
import { Equipment } from './Equipment.js'
import { Technician } from './Technician.js'
import { WithdrawalRecord } from './WithdrawalRecord.js'
import { WithdrawalItem } from './WithdrawalItem.js'
import { StockReceipt } from './StockReceipt.js'
import { StockReceiptItem } from './StockReceiptItem.js'
import { EquipmentImport } from './EquipmentImport.js'

Technician.hasMany(WithdrawalRecord, { foreignKey: 'technicianId' })
WithdrawalRecord.belongsTo(Technician, { foreignKey: 'technicianId' })

WithdrawalRecord.hasMany(WithdrawalItem, { foreignKey: 'withdrawalRecordId', as: 'items' })
WithdrawalItem.belongsTo(WithdrawalRecord, { foreignKey: 'withdrawalRecordId' })

Equipment.hasMany(WithdrawalItem, { foreignKey: 'equipmentId' })
WithdrawalItem.belongsTo(Equipment, { foreignKey: 'equipmentId' })

StockReceipt.hasMany(StockReceiptItem, { foreignKey: 'stockReceiptId', as: 'items' })
StockReceiptItem.belongsTo(StockReceipt, { foreignKey: 'stockReceiptId' })

Equipment.hasMany(StockReceiptItem, { foreignKey: 'equipmentId' })
StockReceiptItem.belongsTo(Equipment, { foreignKey: 'equipmentId' })

User.hasMany(StockReceipt, { foreignKey: 'createdByUserId' })
StockReceipt.belongsTo(User, { foreignKey: 'createdByUserId' })

User.hasMany(EquipmentImport, { foreignKey: 'createdByUserId' })
EquipmentImport.belongsTo(User, { foreignKey: 'createdByUserId' })

export {
  User,
  Equipment,
  Technician,
  WithdrawalRecord,
  WithdrawalItem,
  StockReceipt,
  StockReceiptItem,
  EquipmentImport,
}
