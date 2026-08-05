import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Replaces the per-feature plan limits with a single weekly credit balance
 * priced in LLM tokens.
 *
 * - `plans` trades repo/generation/résumé limits for `weekly_credits`
 *   (Free 300 / Starter 3,000 / Pro 15,000) and loses the `profileCompositions`
 *   key from its `features` JSONB.
 * - `usage_counters` trades the two per-action counters for `credits_used` +
 *   `credits_held`; `period_start` now keys the Monday of a credit week rather
 *   than the first of a month, so the old monthly rows are dropped.
 * - Compositions record the credits held for them, so settlement releases
 *   exactly what was reserved.
 */
export class Credits1785855679662 implements MigrationInterface {
  name = 'Credits1785855679662';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "repo_limit"`);
    await queryRunner.query(
      `ALTER TABLE "plans" DROP COLUMN "generation_limit"`,
    );
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "resume_limit"`);
    await queryRunner.query(
      `ALTER TABLE "usage_counters" DROP COLUMN "generations_used"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usage_counters" DROP COLUMN "profile_compositions_used"`,
    );

    await queryRunner.query(`
      ALTER TABLE "plans"
      ADD "weekly_credits" integer NOT NULL DEFAULT '300'
    `);
    await queryRunner.query(
      `UPDATE "plans" SET "weekly_credits" = 3000 WHERE "tier" = 'starter'`,
    );
    await queryRunner.query(
      `UPDATE "plans" SET "weekly_credits" = 15000 WHERE "tier" = 'pro'`,
    );
    // Profile composes are paid for in credits now, not counted per plan.
    await queryRunner.query(`
      UPDATE "plans"
         SET "features" = "features" - 'profileCompositions'
       WHERE "features" ? 'profileCompositions'
    `);

    // Presentation moves into the table so the pricing pages render from the API
    // instead of hard-coding tier details.
    await queryRunner.query(
      `ALTER TABLE "plans" ADD "name" text NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "plans" ADD "description" text NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "plans" ADD "cta_label" text NOT NULL DEFAULT 'Get started'`,
    );
    await queryRunner.query(
      `ALTER TABLE "plans" ADD "highlight" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "plans" ADD "sort_order" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(`
      UPDATE "plans" SET
        "name"        = 'Free',
        "description" = 'Get started with no commitment.',
        "cta_label"   = 'Start for free',
        "sort_order"  = 0,
        "features"    = "features" || jsonb_build_object('support', 'Community')
       WHERE "tier" = 'free'
    `);
    await queryRunner.query(`
      UPDATE "plans" SET
        "name"        = 'Starter',
        "description" = 'For developers who ship regularly.',
        "cta_label"   = 'Start Starter',
        "highlight"   = true,
        "sort_order"  = 1,
        "features"    = "features" || jsonb_build_object('support', 'Email')
       WHERE "tier" = 'starter'
    `);
    await queryRunner.query(`
      UPDATE "plans" SET
        "name"        = 'Pro',
        "description" = 'For teams and power users.',
        "cta_label"   = 'Start Pro',
        "sort_order"  = 2,
        "features"    = "features" || jsonb_build_object('support', 'Priority')
       WHERE "tier" = 'pro'
    `);
    // Defaults were only needed to backfill existing rows.
    await queryRunner.query(
      `ALTER TABLE "plans" ALTER COLUMN "name" DROP DEFAULT`,
    );

    await queryRunner.query(`
      ALTER TABLE "usage_counters"
      ADD "credits_used" integer NOT NULL DEFAULT '0'
    `);
    await queryRunner.query(`
      ALTER TABLE "usage_counters"
      ADD "credits_held" integer NOT NULL DEFAULT '0'
    `);
    // period_start changes meaning (month → week), so old rows are meaningless.
    await queryRunner.query(`DELETE FROM "usage_counters"`);

    await queryRunner.query(`
      ALTER TABLE "persona_compositions"
      ADD "credits_held" integer NOT NULL DEFAULT '0'
    `);
    await queryRunner.query(`
      ALTER TABLE "project_compositions"
      ADD "credits_held" integer NOT NULL DEFAULT '0'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "sort_order"`);
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "highlight"`);
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "cta_label"`);
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "description"`);
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "name"`);
    await queryRunner.query(
      `UPDATE "plans" SET "features" = "features" - 'support'`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_compositions" DROP COLUMN "credits_held"`,
    );
    await queryRunner.query(
      `ALTER TABLE "persona_compositions" DROP COLUMN "credits_held"`,
    );
    await queryRunner.query(`DELETE FROM "usage_counters"`);
    await queryRunner.query(
      `ALTER TABLE "usage_counters" DROP COLUMN "credits_held"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usage_counters" DROP COLUMN "credits_used"`,
    );
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "weekly_credits"`);

    await queryRunner.query(`
      ALTER TABLE "usage_counters"
      ADD "profile_compositions_used" integer NOT NULL DEFAULT '0'
    `);
    await queryRunner.query(`
      ALTER TABLE "usage_counters"
      ADD "generations_used" integer NOT NULL DEFAULT '0'
    `);
    await queryRunner.query(`
      ALTER TABLE "plans"
      ADD "resume_limit" integer NOT NULL DEFAULT '1'
    `);
    await queryRunner.query(`
      ALTER TABLE "plans"
      ADD "generation_limit" integer NOT NULL DEFAULT '5'
    `);
    await queryRunner.query(`
      ALTER TABLE "plans"
      ADD "repo_limit" integer NOT NULL DEFAULT '3'
    `);

    // Restore the per-tier limits + the profile-composition allowance.
    await queryRunner.query(`
      UPDATE "plans" SET "repo_limit" = 25, "generation_limit" = 75, "resume_limit" = 5
       WHERE "tier" = 'starter'
    `);
    await queryRunner.query(`
      UPDATE "plans" SET "repo_limit" = -1, "generation_limit" = 750, "resume_limit" = -1
       WHERE "tier" = 'pro'
    `);
    await queryRunner.query(`
      UPDATE "plans"
         SET "features" = "features" || jsonb_build_object(
               'profileCompositions',
               CASE "tier" WHEN 'starter' THEN 4 WHEN 'pro' THEN -1 ELSE 1 END
             )
    `);
  }
}
