import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialSchema1730150400000 implements MigrationInterface {
  name = 'CreateInitialSchema1730150400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "CREATE TYPE user_status AS ENUM ('ativo', 'inativo')",
    );
    await queryRunner.query(
      "CREATE TYPE motorcycle_status AS ENUM ('disponivel', 'reservada', 'vendida', 'manutencao', 'informacao_pendente')",
    );
    await queryRunner.query(
      "CREATE TYPE fuel_type AS ENUM ('gasolina', 'etanol', 'flex', 'diesel', 'eletrico', 'hibrido')",
    );
    await queryRunner.query(
      "CREATE TYPE transmission_type AS ENUM ('manual', 'automatica', 'semi_automatica')",
    );

    await queryRunner.query(`
      CREATE TABLE stores (
        id            BIGSERIAL PRIMARY KEY,
        name          VARCHAR(120) NOT NULL,
        cnpj          VARCHAR(20),
        city          VARCHAR(120),
        state         VARCHAR(2),
        address       VARCHAR(255),
        phone         VARCHAR(30),
        is_active     BOOLEAN NOT NULL DEFAULT TRUE,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE roles (
        id         BIGSERIAL PRIMARY KEY,
        name       VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE users (
        id              BIGSERIAL PRIMARY KEY,
        store_id        BIGINT REFERENCES stores(id) ON DELETE SET NULL,
        name            VARCHAR(120) NOT NULL,
        email           VARCHAR(160) UNIQUE NOT NULL,
        password_hash   VARCHAR(255) NOT NULL,
        status          user_status NOT NULL DEFAULT 'ativo',
        last_login_at   TIMESTAMPTZ,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE user_roles (
        user_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id  BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, role_id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE refresh_tokens (
        id           BIGSERIAL PRIMARY KEY,
        user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash   VARCHAR(255) NOT NULL,
        expires_at   TIMESTAMPTZ NOT NULL,
        revoked_at   TIMESTAMPTZ,
        user_agent   VARCHAR(255),
        ip           INET,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_refresh_tokens_user_expires
        ON refresh_tokens (user_id, expires_at)
    `);

    await queryRunner.query(`
      CREATE TABLE brands (
        id         BIGSERIAL PRIMARY KEY,
        name       VARCHAR(120) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE models (
        id         BIGSERIAL PRIMARY KEY,
        brand_id   BIGINT NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
        name       VARCHAR(160) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_models_brand_name UNIQUE (brand_id, name)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE motorcycles (
        id                 BIGSERIAL PRIMARY KEY,
        store_id           BIGINT NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
        brand_id           BIGINT NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
        model_id           BIGINT NOT NULL REFERENCES models(id) ON DELETE RESTRICT,
        year               SMALLINT CHECK (year BETWEEN 1970 AND EXTRACT(YEAR FROM NOW())::INT + 1),
        color              VARCHAR(60),
        vin                VARCHAR(32),
        plate              VARCHAR(16),
        km                 INTEGER CHECK (km >= 0),
        price              NUMERIC(12,2) CHECK (price >= 0),
        cost               NUMERIC(12,2) CHECK (cost >= 0),
        status             motorcycle_status NOT NULL DEFAULT 'disponivel',
        fuel               fuel_type,
        engine_cc          INTEGER CHECK (engine_cc >= 0),
        power_hp           INTEGER CHECK (power_hp >= 0),
        torque_nm          INTEGER CHECK (torque_nm >= 0),
        transmission       transmission_type,
        abs                BOOLEAN,
        description        TEXT,
        has_documentation  BOOLEAN,
        has_inspection     BOOLEAN,
        extra_attributes   JSONB,
        completeness_score SMALLINT CHECK (completeness_score BETWEEN 0 AND 100) DEFAULT 0,
        missing_fields     JSONB,
        is_deleted         BOOLEAN NOT NULL DEFAULT FALSE,
        created_by         BIGINT REFERENCES users(id) ON DELETE SET NULL,
        updated_by         BIGINT REFERENCES users(id) ON DELETE SET NULL,
        created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_motorcycles_vin ON motorcycles (vin) WHERE vin IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_motorcycles_plate ON motorcycles (plate) WHERE plate IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX idx_moto_store ON motorcycles (store_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_moto_brand ON motorcycles (brand_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_moto_model ON motorcycles (model_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_moto_year ON motorcycles (year)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_moto_status ON motorcycles (status)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_moto_price ON motorcycles (price)
    `);

    await queryRunner.query(`
      CREATE TABLE motorcycle_photos (
        id             BIGSERIAL PRIMARY KEY,
        motorcycle_id  BIGINT NOT NULL REFERENCES motorcycles(id) ON DELETE CASCADE,
        path_or_url    TEXT NOT NULL,
        is_cover       BOOLEAN NOT NULL DEFAULT FALSE,
        sort_order     SMALLINT NOT NULL DEFAULT 0,
        metadata       JSONB,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_moto_photos_moto ON motorcycle_photos (motorcycle_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_moto_photos_cover ON motorcycle_photos (motorcycle_id, is_cover)
    `);

    await queryRunner.query(`
      CREATE TABLE audit_log (
        id           BIGSERIAL PRIMARY KEY,
        user_id      BIGINT REFERENCES users(id) ON DELETE SET NULL,
        entity       VARCHAR(80) NOT NULL,
        entity_id    BIGINT NOT NULL,
        action       VARCHAR(30) NOT NULL,
        changed_data JSONB,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_audit_entity ON audit_log (entity, entity_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_audit_user ON audit_log (user_id, created_at)
    `);

    await queryRunner.query(`
      INSERT INTO roles (name) VALUES ('admin'), ('viewer'), ('client')
      ON CONFLICT (name) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_audit_user');
    await queryRunner.query('DROP INDEX IF EXISTS idx_audit_entity');
    await queryRunner.query('DROP TABLE IF EXISTS audit_log');

    await queryRunner.query('DROP INDEX IF EXISTS idx_moto_photos_cover');
    await queryRunner.query('DROP INDEX IF EXISTS idx_moto_photos_moto');
    await queryRunner.query('DROP TABLE IF EXISTS motorcycle_photos');

    await queryRunner.query('DROP INDEX IF EXISTS idx_moto_price');
    await queryRunner.query('DROP INDEX IF EXISTS idx_moto_status');
    await queryRunner.query('DROP INDEX IF EXISTS idx_moto_year');
    await queryRunner.query('DROP INDEX IF EXISTS idx_moto_model');
    await queryRunner.query('DROP INDEX IF EXISTS idx_moto_brand');
    await queryRunner.query('DROP INDEX IF EXISTS idx_moto_store');
    await queryRunner.query('DROP INDEX IF EXISTS uq_motorcycles_plate');
    await queryRunner.query('DROP INDEX IF EXISTS uq_motorcycles_vin');
    await queryRunner.query('DROP TABLE IF EXISTS motorcycles');

    await queryRunner.query('DROP TABLE IF EXISTS models');
    await queryRunner.query('DROP TABLE IF EXISTS brands');

    await queryRunner.query('DROP INDEX IF EXISTS idx_refresh_tokens_user_expires');
    await queryRunner.query('DROP TABLE IF EXISTS refresh_tokens');

    await queryRunner.query('DROP TABLE IF EXISTS user_roles');
    await queryRunner.query('DROP TABLE IF EXISTS users');
    await queryRunner.query('DROP TABLE IF EXISTS roles');
    await queryRunner.query('DROP TABLE IF EXISTS stores');

    await queryRunner.query('DROP TYPE IF EXISTS transmission_type');
    await queryRunner.query('DROP TYPE IF EXISTS fuel_type');
    await queryRunner.query('DROP TYPE IF EXISTS motorcycle_status');
    await queryRunner.query('DROP TYPE IF EXISTS user_status');
  }
}
