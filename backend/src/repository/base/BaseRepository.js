class BaseRepository {
  constructor(database, tableName, idColumn, options = {}) {
    this.db = database;
    this.tableName = tableName;
    this.idColumn = idColumn;
    this.defaultOrderBy = options.defaultOrderBy || `${idColumn} DESC`;
    this.defaultSelect = options.defaultSelect || "*";
  }

  buildWhereClause(filters = {}) {
    const entries = Object.entries(filters).filter(
      ([, value]) => value !== undefined,
    );

    if (!entries.length) {
      return {
        clause: "",
        values: [],
      };
    }

    return {
      clause: `WHERE ${entries.map(([key]) => `${key} = ?`).join(" AND ")}`,
      values: entries.map(([, value]) => value),
    };
  }

  async findById(id, connection = null, columns = this.defaultSelect) {
    const rows = await this.db.query(
      `SELECT ${columns} FROM ${this.tableName} WHERE ${this.idColumn} = ? LIMIT 1`,
      [id],
      connection,
    );
    return rows[0] || null;
  }

  async findOneBy(filters = {}, connection = null, options = {}) {
    const { clause, values } = this.buildWhereClause(filters);
    const orderBy = options.orderBy || this.defaultOrderBy;
    const columns = options.columns || this.defaultSelect;
    const rows = await this.db.query(
      `SELECT ${columns} FROM ${this.tableName} ${clause} ORDER BY ${orderBy} LIMIT 1`,
      values,
      connection,
    );
    return rows[0] || null;
  }

  async findAll(options = {}, connection = null) {
    const {
      filters = {},
      limit = null,
      offset = 0,
      orderBy = this.defaultOrderBy,
      columns = this.defaultSelect,
    } = options;
    const { clause, values } = this.buildWhereClause(filters);
    const paginationClause =
      limit == null ? "" : ` LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    return this.db.query(
      `SELECT ${columns} FROM ${this.tableName} ${clause} ORDER BY ${orderBy}${paginationClause}`,
      values,
      connection,
    );
  }

  async exists(filters = {}, connection = null) {
    const record = await this.findOneBy(filters, connection, {
      columns: this.idColumn,
    });
    return Boolean(record);
  }

  async create(data, connection = null) {
    const filteredEntries = Object.entries(data).filter(
      ([, value]) => value !== undefined,
    );
    const keys = filteredEntries.map(([key]) => key);
    const placeholders = keys.map(() => "?").join(", ");
    const values = filteredEntries.map(([, value]) => value);

    const result = await this.db.execute(
      `INSERT INTO ${this.tableName} (${keys.join(", ")}) VALUES (${placeholders})`,
      values,
      connection,
    );

    return this.findById(result.insertId, connection);
  }

  async update(id, data, connection = null) {
    const filteredEntries = Object.entries(data).filter(
      ([, value]) => value !== undefined,
    );
    const keys = filteredEntries.map(([key]) => key);
    const values = filteredEntries.map(([, value]) => value);

    if (!keys.length) {
      return this.findById(id, connection);
    }

    const clause = keys.map((key) => `${key} = ?`).join(", ");

    await this.db.execute(
      `UPDATE ${this.tableName} SET ${clause}, updated_at = CURRENT_TIMESTAMP WHERE ${this.idColumn} = ?`,
      [...values, id],
      connection,
    );

    return this.findById(id, connection);
  }

  async delete(id, connection = null) {
    await this.db.execute(
      `DELETE FROM ${this.tableName} WHERE ${this.idColumn} = ?`,
      [id],
      connection,
    );
  }

  async deleteById(id, connection = null) {
    return this.delete(id, connection);
  }
}

module.exports = BaseRepository;
