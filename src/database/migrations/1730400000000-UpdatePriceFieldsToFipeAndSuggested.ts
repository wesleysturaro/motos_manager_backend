import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatePriceFieldsToFipeAndSuggested1730400000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adiciona as novas colunas fipe_price e suggested_price
    await queryRunner.query(`
      ALTER TABLE "motorcycles"
      ADD COLUMN "fipe_price" NUMERIC(12, 2),
      ADD COLUMN "suggested_price" NUMERIC(12, 2)
    `);

    // Migra os dados existentes: price -> fipe_price
    await queryRunner.query(`
      UPDATE "motorcycles"
      SET "fipe_price" = "price"
      WHERE "price" IS NOT NULL
    `);

    // Remove as colunas antigas price e cost
    await queryRunner.query(`
      ALTER TABLE "motorcycles"
      DROP COLUMN "price",
      DROP COLUMN "cost"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restaura as colunas antigas
    await queryRunner.query(`
      ALTER TABLE "motorcycles"
      ADD COLUMN "price" NUMERIC(12, 2),
      ADD COLUMN "cost" NUMERIC(12, 2)
    `);

    // Migra de volta: fipe_price -> price
    await queryRunner.query(`
      UPDATE "motorcycles"
      SET "price" = "fipe_price"
      WHERE "fipe_price" IS NOT NULL
    `);

    // Remove as novas colunas
    await queryRunner.query(`
      ALTER TABLE "motorcycles"
      DROP COLUMN "fipe_price",
      DROP COLUMN "suggested_price"
    `);
  }
}
