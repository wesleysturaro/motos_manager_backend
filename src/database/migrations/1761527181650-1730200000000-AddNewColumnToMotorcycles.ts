import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedStoresTable1761527181650 implements MigrationInterface {
  name = 'SeedStoresTable1761527181650';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO stores (name, cnpj, city, state, address, phone, is_active, created_at, updated_at)
      VALUES 
        (
          'RLeo',
          '12.345.678/0001-99',
          'Jaguariúna',
          'SP',
          'Av. Prefeito João Bueno, 123 - Centro',
          '(19) 3837-4567',
          true,
          NOW(),
          NOW()
        );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM stores WHERE name = 'RLeo' AND city = 'Jaguariúna';
    `);
  }
}
