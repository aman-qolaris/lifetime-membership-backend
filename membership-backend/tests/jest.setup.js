process.env.NODE_ENV = "test";

// Use in-memory sqlite for tests so we don't touch local MySQL.
process.env.DB_DIALECT = "sqlite";
process.env.DB_STORAGE = ":memory:";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

// Avoid accidental external calls
process.env.MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || "127.0.0.1";
process.env.MINIO_PORT = process.env.MINIO_PORT || "9000";
process.env.MINIO_USE_SSL = process.env.MINIO_USE_SSL || "false";
process.env.MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || "test";
process.env.MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || "test";
process.env.MINIO_BUCKET_NAME = process.env.MINIO_BUCKET_NAME || "test-bucket";
