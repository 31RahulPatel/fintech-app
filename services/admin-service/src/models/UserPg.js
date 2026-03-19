const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserPg = sequelize.define('UserPg', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    transactionCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalSpent: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    lastLogin: {
      type: DataTypes.DATE
    },
    ipAddress: {
      type: DataTypes.STRING
    },
    userAgent: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'users_pg',
    timestamps: true
  });

  return UserPg;
};
