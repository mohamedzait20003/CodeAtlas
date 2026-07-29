import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Subscription domain: billing plans, the AI-model catalog, per-period usage, and
 * the admin audit log.
 *   plans · subscriptions · usage_counters · ai_models · audit_logs
 */
export class Subscription1785300000001 implements MigrationInterface {
  name = 'Subscription1785300000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."plans_tier_enum" AS ENUM('free', 'starter', 'pro')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."plans_model_tier_enum" AS ENUM('economy', 'standard', 'premium')`,
    );
    await queryRunner.query(`
      CREATE TABLE "plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tier" "public"."plans_tier_enum" NOT NULL,
        "price_monthly" integer NOT NULL DEFAULT '0',
        "repo_limit" integer NOT NULL DEFAULT '3',
        "generation_limit" integer NOT NULL DEFAULT '5',
        "resume_limit" integer NOT NULL DEFAULT '1',
        "model_tier" "public"."plans_model_tier_enum" NOT NULL DEFAULT 'economy',
        "model" text NOT NULL,
        "features" jsonb NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_8f72a20c98ab97e783c5e87ea2a" UNIQUE ("tier"),
        CONSTRAINT "PK_3720521a81c7c24fe9b7202ba61" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('active', 'past_due', 'canceled', 'trialing')`,
    );
    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "plan_id" uuid NOT NULL,
        "status" "public"."subscriptions_status_enum" NOT NULL DEFAULT 'trialing',
        "stripe_subscription_id" text,
        "current_period_end" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "REL_d0a95ef8a28188364c546eb65c" UNIQUE ("user_id"),
        CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_d0a95ef8a28188364c546eb65c" ON "subscriptions" ("user_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "usage_counters" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "period_start" date NOT NULL,
        "generations_used" integer NOT NULL DEFAULT '0',
        "profile_compositions_used" integer NOT NULL DEFAULT '0',
        CONSTRAINT "PK_fb39db314fa8fc2b6653f2f4e31" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_45a668e218ea9dda68bcfd5bb3" ON "usage_counters" ("user_id", "period_start")`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."ai_models_provider_enum" AS ENUM('google', 'anthropic', 'openai')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ai_models_tier_enum" AS ENUM('economy', 'standard', 'premium')`,
    );
    await queryRunner.query(`
      CREATE TABLE "ai_models" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "provider" "public"."ai_models_provider_enum" NOT NULL,
        "model_id" text NOT NULL,
        "display_name" text NOT NULL,
        "description" text,
        "tier" "public"."ai_models_tier_enum" NOT NULL DEFAULT 'economy',
        "is_enabled" boolean NOT NULL DEFAULT true,
        "is_default" boolean NOT NULL DEFAULT false,
        "context_window" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_decc9db3d7ccf057eec51b68be7" UNIQUE ("provider", "model_id"),
        CONSTRAINT "PK_3d254744f0bcf6f35be5826e25e" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "action" text NOT NULL,
        "target_type" text,
        "target_id" text,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_d0a95ef8a28188364c546eb65c1" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_e45fca5d912c3a2fab512ac25dc" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "usage_counters" ADD CONSTRAINT "FK_c9fa4c48ed77252ef609b6b45bd" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usage_counters" DROP CONSTRAINT "FK_c9fa4c48ed77252ef609b6b45bd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_e45fca5d912c3a2fab512ac25dc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_d0a95ef8a28188364c546eb65c1"`,
    );
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TABLE "ai_models"`);
    await queryRunner.query(`DROP TYPE "public"."ai_models_tier_enum"`);
    await queryRunner.query(`DROP TYPE "public"."ai_models_provider_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_45a668e218ea9dda68bcfd5bb3"`,
    );
    await queryRunner.query(`DROP TABLE "usage_counters"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d0a95ef8a28188364c546eb65c"`,
    );
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
    await queryRunner.query(`DROP TABLE "plans"`);
    await queryRunner.query(`DROP TYPE "public"."plans_model_tier_enum"`);
    await queryRunner.query(`DROP TYPE "public"."plans_tier_enum"`);
  }
}
