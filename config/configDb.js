/*const mysql = require('mysql2/promise')

const createConnection = async () => {
    const conn = await mysql.createConnection({
        port: 3306,
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'agenda_consultorio'
    })
    return conn
}

module.exports = createConnection*/
const mysql = require('mysql2/promise');

const createConnection = async () => {
    const conn = await mysql.createConnection({
        port: 3306, // o el puerto proporcionado por Clever Cloud
        host: 'b719xs9ak6gvys1pyl5x-mysql.services.clever-cloud.com', // ejemplo, remplaza con tu host
        user: 'upgbqgqjxvipoysf', // reemplaza con el usuario que Clever Cloud te dio
        password: 'I01emlktUHWBKbD7zJHX', // reemplaza con tu contraseña
        database: 'b719xs9ak6gvys1pyl5x' // reemplaza con el nombre de tu base de datos en Clever Cloud
    });
    return conn;
};

module.exports = createConnection;
