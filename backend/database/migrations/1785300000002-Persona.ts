import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Persona domain: "Compose Your Profile" jobs (profile README from résumé + repos).
 *   persona_compositions
 */
export class Persona1785300000002 implements MigrationInterface {
  name = 'Persona1785300000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."persona_compositions_status_enum" AS ENUM('queued', 'running', 'completed', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."persona_compositions_provider_enum" AS ENUM('google', 'anthropic', 'openai')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."persona_compositions_push_mode_enum" AS ENUM('manual', 'pr', 'direct')`,
    );
    await queryRunner.query(`
      CREATE TABLE "persona_compositions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "resume_id" uuid,
        "intent" text,
        "status" "public"."persona_compositions_status_enum" NOT NULL DEFAULT 'queued',
        "phase" text,
        "ai_model_id" uuid,
        "provider" "public"."persona_compositions_provider_enum",
        "model" text,
        "push_mode" "public"."persona_compositions_push_mode_enum" NOT NULL DEFAULT 'manual',
        "generated_md" text,
        "pr_url" text,
        "commit_sha" text,
        "input_tokens" integer,
        "output_tokens" integer,
        "error" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "completed_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_a56538d47cee3c625bec6215fee" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "persona_compositions" ADD CONSTRAINT "FK_56f1cf73a179656ea2366336223" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "persona_compositions" ADD CONSTRAINT "FK_944304ef719af7283752c049a94" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "persona_compositions" ADD CONSTRAINT "FK_377ae9c002907c06d2d99e35dd1" FOREIGN KEY ("ai_model_id") REFERENCES "ai_models"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "persona_compositions" DROP CONSTRAINT "FK_377ae9c002907c06d2d99e35dd1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "persona_compositions" DROP CONSTRAINT "FK_944304ef719af7283752c049a94"`,
    );
    await queryRunner.query(
      `ALTER TABLE "persona_compositions" DROP CONSTRAINT "FK_56f1cf73a179656ea2366336223"`,
    );
    await queryRunner.query(`DROP TABLE "persona_compositions"`);
    await queryRunner.query(
      `DROP TYPE "public"."persona_compositions_push_mode_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."persona_compositions_provider_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."persona_compositions_status_enum"`,
    );
  }
}
