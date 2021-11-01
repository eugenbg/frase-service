const { Sequelize, DataTypes, Model} = require('sequelize');

const sequelize = new Sequelize('csc', 'eugen', 'password', {
    host: 'localhost',
    dialect: 'mariadb'
});

class University extends Model {}

University.init({
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    region: {
        type: DataTypes.STRING,
        allowNull: false
    },
    link: {
        type: DataTypes.STRING
    }
}, {
    sequelize,
    modelName: 'University'
});


class UniversityProgram extends Model {}

UniversityProgram.init({
    university_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unsigned: true,
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    language: {
        type: DataTypes.STRING,
        allowNull: false
    },
    years: {
        type: DataTypes.DECIMAL,
    },
    price: {
        type: DataTypes.INTEGER,
    },
}, {
    
    sequelize,
    modelName: 'UniversityProgram',
    tableName: 'uni_programs'
});

class UniversityScholarship extends Model {}

UniversityScholarship.init({
    
    university_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unsigned: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    link: {
        type: DataTypes.STRING,
        allowNull: false
    },
}, {
    sequelize,
    modelName: 'UniversityScholarship',
    tableName: 'uni_scholarships'
});

class UniversityImage extends Model {
    TYPE_CAMPUS = 'campus';
    TYPE_DORM = 'dorm';
}

UniversityImage.init({
    
    university_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unsigned: true,
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    local_path: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
}, {
    sequelize,
    modelName: 'UniversityImage',
    tableName: 'uni_images'
});

(async () => {
    try {
        await sequelize.authenticate();
        console.log('DB Connection has been established successfully.');
        await University.sync();
        await UniversityProgram.sync();
        await UniversityScholarship.sync();
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
})();

module.exports.University = University;
module.exports.UniversityProgram = UniversityProgram;