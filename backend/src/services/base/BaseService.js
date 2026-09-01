const ValidationException = require("../../exceptions/ValidationException");

class BaseService {
  constructor({
    repository = null,
    entityClass = null,
    cacheService = null,
    logger = null,
    notFoundMessage = "Resource not found.",
  } = {}) {
    this.repository = repository;
    this.entityClass = entityClass;
    this.cacheService = cacheService;
    this.logger = logger;
    this.notFoundMessage = notFoundMessage;
  }

  toEntity(record) {
    if (!record || !this.entityClass) {
      return record;
    }

    return new this.entityClass(record);
  }

  serialize(record) {
    if (!record) {
      return record;
    }

    const entity = this.toEntity(record);

    if (typeof entity?.toPublicJSON === "function") {
      return entity.toPublicJSON();
    }

    if (typeof entity?.toJSON === "function") {
      return entity.toJSON();
    }

    return entity;
  }

  serializeCollection(records = []) {
    return records.map((record) => this.serialize(record));
  }

  async getByIdOrFail(id, options = {}) {
    const { connection = null, notFoundMessage = this.notFoundMessage } =
      options;
    const record = await this.repository.findById(id, connection);

    if (!record) {
      throw new ValidationException(notFoundMessage);
    }

    return record;
  }

  async list(options = {}, connection = null) {
    const records = await this.repository.findAll(options, connection);
    return this.serializeCollection(records);
  }

  async createRecord(payload, connection = null) {
    const record = await this.repository.create(payload, connection);
    return this.serialize(record);
  }

  async updateRecord(id, payload, options = {}) {
    const { connection = null, notFoundMessage = this.notFoundMessage } =
      options;
    await this.getByIdOrFail(id, { connection, notFoundMessage });
    const updated = await this.repository.update(id, payload, connection);
    return this.serialize(updated);
  }

  async deleteRecord(id, options = {}) {
    const { connection = null, notFoundMessage = this.notFoundMessage } =
      options;
    const record = await this.getByIdOrFail(id, {
      connection,
      notFoundMessage,
    });
    await this.repository.deleteById(id, connection);
    return this.serialize(record);
  }
}

module.exports = BaseService;
