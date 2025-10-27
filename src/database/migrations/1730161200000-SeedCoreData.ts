import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedCoreData1730161200000 implements MigrationInterface {
  name = 'SeedCoreData1730161200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO roles (name)
      VALUES ('admin'), ('viewer'), ('client')
      ON CONFLICT (name) DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO brands (name)
      VALUES
        ('Honda'),
        ('Yamaha'),
        ('BMW'),
        ('Royal Enfield'),
        ('Suzuki'),
        ('Dafra')
      ON CONFLICT (name) DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO users (name, email, password_hash)
      VALUES
        ('Admin Rleo', 'admin@rleomotos.com', '$2b$10$I0Nq56TD7bmVl1NuuA6QzOGc99cRB87NnTcgNOP0nypP6ZgfI8QPC'),
        ('Viewer Rleo', 'viewer@rleomotos.com', '$2b$10$uxeLJMEVwq.QEdAlZembEOBeMP2KNHx7YiGRAIzbBCdVOlU1PYBGG'),
        ('Cliente Rleo', 'cliente@rleomotos.com', '$2b$10$gpvozkCuOP8G/datulE.mu.oCviT4eonaN0JaUjEmVND5MSm9MeWm')
      ON CONFLICT (email) DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO user_roles (user_id, role_id)
      SELECT u.id, r.id
      FROM users u
      JOIN roles r ON (
        (u.email = 'admin@rleomotos.com' AND r.name = 'admin') OR
        (u.email = 'viewer@rleomotos.com' AND r.name = 'viewer') OR
        (u.email = 'cliente@rleomotos.com' AND r.name = 'client')
      )
      ON CONFLICT (user_id, role_id) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM user_roles
      WHERE user_id IN (
        SELECT id FROM users WHERE email IN (
          'admin@rleomotos.com',
          'viewer@rleomotos.com',
          'cliente@rleomotos.com'
        )
      )
    `);

    await queryRunner.query(`
      DELETE FROM users
      WHERE email IN (
        'admin@rleomotos.com',
        'viewer@rleomotos.com',
        'cliente@rleomotos.com'
      )
    `);

    await queryRunner.query(`
      DELETE FROM brands
      WHERE name IN ('Honda', 'Yamaha', 'BMW', 'Royal Enfield', 'Suzuki', 'Dafra')
    `);
  }
}
