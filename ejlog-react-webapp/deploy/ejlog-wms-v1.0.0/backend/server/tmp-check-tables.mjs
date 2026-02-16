import { getPool } from './db-config.js';
const pool = await getPool();
const res = await pool.request().query('SELECT TOP 5 idTipoLista FROM Liste');
console.log(res.recordset);
