# package.json
1. run the command npm init -y for package.json

# express
2. npm install express for node

# nodemon and dot env
3. install the package nodemon and dotenv package

# .env(environment)
4. in .env :
APP_PORT=3000
DB_USERNAME=postgres
DB_PASSWORD=1234
DB_NAME=learn_node
DB_NAME_TEST=database_test
DB_NAME_PROD=database_production
DB_HOST=127.0.0.1
DB_DIALECT=postgres

# jwt info in dotenv
JWT_SECRET_KEY=very-very-long-secret-key
JWT_EXPIRES_IN=90d

# root file app.js
5. create app.js in project and add

require('dotenv').config({ path: `${process.cwd()}/.env` });

const express = require('express');
const app = express();
const authRoute = require('./route/authRoute');

//all routes from here
app.use('/api/auth',authRoute);

app.use('\*', (req ,res ,next) => {
res.status(404).json({
status: 'fail',
message: 'Route not found',
})
})

const PORT = process.env.APP_PORT || 8000;

app.listen(PORT, () => {
console.log('server up and running',PORT);
});

# .sequelizer
6. go to the sequizer and run the packages and add a file named as sequelizerc in migration.
const path = require('path');

module.exports = {
config: path.resolve('config', 'config.js'),
'models-path': path.resolve('db', 'models'),
'seeders-path': path.resolve('db', 'seeders'),
'migrations-path': path.resolve('db', 'migrations'),
};


# .sequelizer command
7. run the command -----> npx sequelize-cli init

8. add module.exports in newly created config.js.

9. db create:npx sequelize-cli db:create

10. create model and migration :npx sequelize-cli model:generate --name user --attributes userType:Enum,firstName:string,lastName:string,email:string,password:string

11. create a database.js in config folder
    const { Sequelize } = require("sequelize");

const env = process.env.NODE_ENV || 'development';
const config = require("./config");

const sequelize = new Sequelize(config[env]);

module.exports = sequelize;

12. db migrate ---->db create:npx sequelize-cli db:migrate

13. db undo ---->db create:npx sequelize-cli db:migrate:undo or npx sequelize-cli db:migrate:undo all
