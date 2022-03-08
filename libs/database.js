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
    heading: {
        type: DataTypes.STRING,
        allowNull: false
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
module.exports.sequelize = sequelize;
