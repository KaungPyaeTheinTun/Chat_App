const mysql = require("mysql2/promise");

class Database {
  constructor() {
    if (Database.instance) {
      return Database.instance;
    }

    this.pool = mysql.createPool({
      host: process.env.DATABASE_HOST || "127.0.0.1",
      port: Number(process.env.DATABASE_PORT || 3306),
      user: process.env.DATABASE_USER || "chat_user",
      password: process.env.DATABASE_PASSWORD || "chat_password",
      database: process.env.DATABASE_NAME || "chat_app",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });

    Database.instance = this;
  }

  async query(sql, params = [], connection = null) {
    const executor = connection || this.pool;
    const [rows] = await executor.query(sql, params);
    return rows;
  }

  async execute(sql, params = [], connection = null) {
    const executor = connection || this.pool;
    const [result] = await executor.execute(sql, params);
    return result;
  }

  async withTransaction(callback) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }

    return Database.instance;
  }
}

module.exports = Database;
