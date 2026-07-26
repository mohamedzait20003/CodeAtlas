import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Renames the user-facing "Narrate/Narration" feature to "Compose/Composition".
 * Only two things are actually stored in the DB (everything else — controllers,
 * DTOs, the QuotaKind value — is code-only):
 *   - usage_counters.profile_narrations_used → profile_compositions_used
 *   - plans.features JSONB key  profileNarrations → profileCompositions
 * A plain rename (data preserved), fully reversible.
 */
export class RenameNarrationToComposition1784000000000
  implements MigrationInterface
{
  name = 'RenameNarrationToComposition1784000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "usage_counters"
      RENAME COLUMN "profile_narrations_used" TO "profile_compositions_used"
    `);
    await queryRunner.query(`
      UPDATE "plans"
         SET "features" = ("features" - 'profileNarrations')
                        || jsonb_build_object('profileCompositions', "features"->'profileNarrations')
       WHERE "features" ? 'profileNarrations'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "plans"
         SET "features" = ("features" - 'profileCompositions')
                        || jsonb_build_object('profileNarrations', "features"->'profileCompositions')
       WHERE "features" ? 'profileCompositions'
    `);
    await queryRunner.query(`
      ALTER TABLE "usage_counters"
      RENAME COLUMN "profile_compositions_used" TO "profile_narrations_used"
    `);
  }
}
