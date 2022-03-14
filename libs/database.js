const { Sequelize, DataTypes, Model} = require('sequelize');

const sequelize = new Sequelize('frase', 'eugen', 'password', {
    host: 'localhost',
    dialect: 'mariadb'
});

class Keyword extends Model {}

Keyword.init({
    keyword: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    country: {
        type: DataTypes.STRING,
        allowNull: false
    },
}, {
    timestamps: false,
    sequelize,
    modelName: 'Keyword',
    tableName: 'keywords'
});


class Piece extends Model {}

Piece.init({
    keyword_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unsigned: true,
    },
    serp_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unsigned: true,
    },
    heading: {
        type: DataTypes.STRING,
        allowNull: false
    },
    position: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unsigned: true,
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
}, {
    timestamps: false,
    sequelize,
    modelName: 'Piece',
    tableName: 'pieces'
});

class Serp extends Model {}

Serp.init({
    keyword_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unsigned: true,
    },
    position: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unsigned: true,
    },
    links: {
        type: DataTypes.INTEGER,
        allowNull: true,
        unsigned: true,
    },
    da: {
        type: DataTypes.INTEGER,
        allowNull: true,
        unsigned: true,
    },
    url: {
        type: DataTypes.TEXT,
        allowNull: false,
        unsigned: true,
    },
}, {
    timestamps: false,
    sequelize,
    modelName: 'Serp',
    tableName: 'serps'
});

(async () => {
    try {
        await sequelize.authenticate();
        console.log('DB Connection has been established successfully.');
        await Keyword.sync();
        await Piece.sync();
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
})();

module.exports.Keyword = Keyword;
module.exports.Piece = Piece;
module.exports.Serp = Serp;
module.exports.sequelize = sequelize;
