const { DataTypes } = require('sequelize');
const { sequelize } = require('../index');

// Define the model but don't immediately sync
let UserPg;

const defineUserModel = (sequelizeInstance) => {
  return sequelizeInstance.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    mongoId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING
    },
    role: {
      type: DataTypes.ENUM('user', 'premium', 'admin'),
      defaultValue: 'user'
    },
    cognitoSub: {
      type: DataTypes.STRING
    },
    subscriptionType: {
      type: DataTypes.ENUM('free', 'basic', 'premium', 'enterprise'),
      defaultValue: 'free'
    },
    subscriptionStartDate: {
      type: DataTypes.DATE
    },
    subscriptionEndDate: {
      type: DataTypes.DATE
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastLoginAt: {
      type: DataTypes.DATE
    },
    loginCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'users',
    timestamps: true,
    indexes: [
      { fields: ['email'] },
      { fields: ['mongoId'] },
      { fields: ['cognitoSub'] },
      { fields: ['subscriptionType'] }
    ]
  });
};

// Factory pattern for getting the model
const getModel = (sequelizeInstance) => {
  if (!UserPg) {
    UserPg = defineUserModel(sequelizeInstance);
  }
  return UserPg;
};

// For direct usage when sequelize is available
class UserPgModel {
  static init(sequelizeInstance) {
    return defineUserModel(sequelizeInstance);
  }
  
  static async create(data) {
    const { sequelize } = require('../index');
    const Model = getModel(sequelize);
    return Model.create(data);
  }

  static async findOne(options) {
    const { sequelize } = require('../index');
    const Model = getModel(sequelize);
    return Model.findOne(options);
  }

  static async findAll(options) {
    const { sequelize } = require('../index');
    const Model = getModel(sequelize);
    return Model.findAll(options);
  }

  static async update(data, options) {
    const { sequelize } = require('../index');
    const Model = getModel(sequelize);
    return Model.update(data, options);
  }
}

module.exports = UserPgModel;
