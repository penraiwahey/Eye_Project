import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/db.js'

export class User extends Model {
  toSafeJSON() {
    const { id, name, email, role, createdAt, updatedAt } = this
    return { id, name, email, role, createdAt, updatedAt }
  }
}

User.init(
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
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash',
    },
    role: {
      type: DataTypes.ENUM('admin', 'staff'),
      allowNull: false,
      defaultValue: 'staff',
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
  },
)
