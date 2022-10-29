const pgp = require('pg-promise')(/*options*/);
const dotenv = require('dotenv').config();
const cn = {
    host: 'db',
    port: process.env.POSTGRES_PORT||5432,
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD|| '1234'
};
const db = pgp(cn);

module.exports=db;


