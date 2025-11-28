import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddModelYearToMotorcycle1730310000001 implements MigrationInterface {
  name = 'AddModelYearToMotorcycle1730310000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE motorcycles ADD COLUMN IF NOT EXISTS model SMALLINT');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE motorcycles DROP COLUMN IF EXISTS model');
  }
}
