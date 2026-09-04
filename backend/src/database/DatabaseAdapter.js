class DatabaseAdapter {
  async query() {
    throw new Error("DatabaseAdapter.query must be implemented.");
  }

  async execute() {
    throw new Error("DatabaseAdapter.execute must be implemented.");
  }

  async withTransaction() {
    throw new Error("DatabaseAdapter.withTransaction must be implemented.");
  }
}

module.exports = DatabaseAdapter;
