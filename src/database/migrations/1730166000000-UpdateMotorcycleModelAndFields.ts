import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateMotorcycleModelAndFields1730166000000 implements MigrationInterface {
  name = 'UpdateMotorcycleModelAndFields1730166000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_moto_model');
    await queryRunner.query('ALTER TABLE motorcycles DROP CONSTRAINT IF EXISTS "motorcycles_model_id_fkey"');
    await queryRunner.query('ALTER TABLE motorcycles DROP COLUMN IF EXISTS model_id');
    await queryRunner.query("ALTER TABLE motorcycles ADD COLUMN IF NOT EXISTS model_name VARCHAR(160) NOT NULL DEFAULT ''");
    await queryRunner.query("ALTER TABLE motorcycles ALTER COLUMN model_name DROP DEFAULT");

    await queryRunner.query(
      "ALTER TABLE motorcycles ADD COLUMN IF NOT EXISTS client_name VARCHAR(160)",
    );
    await queryRunner.query(
      "ALTER TABLE motorcycles ADD COLUMN IF NOT EXISTS client_phone VARCHAR(30)",
    );
    await queryRunner.query(
      "ALTER TABLE motorcycles ADD COLUMN IF NOT EXISTS document_cost NUMERIC(12,2)",
    );
    await queryRunner.query(
      "ALTER TABLE motorcycles ADD COLUMN IF NOT EXISTS maintenance_cost NUMERIC(12,2)",
    );
    await queryRunner.query(
      "ALTER TABLE motorcycles ADD COLUMN IF NOT EXISTS down_payment NUMERIC(12,2)",
    );

    await queryRunner.query('DROP TABLE IF EXISTS models');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE IF NOT EXISTS models (id BIGSERIAL PRIMARY KEY, brand_id BIGINT NOT NULL REFERENCES brands(id) ON DELETE RESTRICT, name VARCHAR(160) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), CONSTRAINT uq_models_brand_name UNIQUE (brand_id, name))',
    );
    await queryRunner.query('ALTER TABLE motorcycles ADD COLUMN IF NOT EXISTS model_id BIGINT');
    await queryRunner.query(
      'ALTER TABLE motorcycles ADD CONSTRAINT motorcycles_model_id_fkey FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE RESTRICT',
    );
    await queryRunner.query('CREATE INDEX IF NOT EXISTS idx_moto_model ON motorcycles (model_id)');

    await queryRunner.query('ALTER TABLE motorcycles DROP COLUMN IF EXISTS model_name');
    await queryRunner.query('ALTER TABLE motorcycles DROP COLUMN IF EXISTS client_name');
    await queryRunner.query('ALTER TABLE motorcycles DROP COLUMN IF EXISTS client_phone');
    await queryRunner.query('ALTER TABLE motorcycles DROP COLUMN IF EXISTS document_cost');
    await queryRunner.query('ALTER TABLE motorcycles DROP COLUMN IF EXISTS maintenance_cost');
    await queryRunner.query('ALTER TABLE motorcycles DROP COLUMN IF EXISTS down_payment');
  }
}
