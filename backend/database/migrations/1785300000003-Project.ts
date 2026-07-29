import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Project domain: synced GitHub repositories + "Compose a README" jobs.
 *   repositories · project_compositions
 */
export class Project1785300000003 implements MigrationInterface {
  name = 'Project1785300000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "repositories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "github_repo_id" bigint NOT NULL,
        "full_name" text NOT NULL,
        "default_branch" text NOT NULL DEFAULT 'main',
        "is_private" boolean NOT NULL DEFAULT false,
        "last_analyzed_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_ef0c358c04b4f4d29b8ca68ddff" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_d1358d284c5c08ac0cde471c78" ON "repositories" ("user_id", "github_repo_id")`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."project_compositions_status_enum" AS ENUM('queued', 'running', 'completed', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."project_compositions_provider_enum" AS ENUM('google', 'anthropic', 'openai')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."project_compositions_push_mode_enum" AS ENUM('manual', 'pr', 'direct')`,
    );
    await queryRunner.query(`
      CREATE TABLE "project_compositions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "repo_id" uuid NOT NULL,
        "intent" text,
        "status" "public"."project_compositions_status_enum" NOT NULL DEFAULT 'queued',
        "phase" text,
        "ai_model_id" uuid,
        "provider" "public"."project_compositions_provider_enum",
        "model" text,
        "push_mode" "public"."project_compositions_push_mode_enum" NOT NULL DEFAULT 'manual',
        "generated_md" text,
        "pr_url" text,
        "commit_sha" text,
        "input_tokens" integer,
        "output_tokens" integer,
        "error" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "completed_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_86c723e5253a0bddafcecf5b55f" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "repositories" ADD CONSTRAINT "FK_01d0a80f46bb43811628f4174f6" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_compositions" ADD CONSTRAINT "FK_809bdf057204c8b2cc57c2d80a3" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_compositions" ADD CONSTRAINT "FK_9ef39dc2d0792cfbaa3c5168029" FOREIGN KEY ("repo_id") REFERENCES "repositories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_compositions" ADD CONSTRAINT "FK_b3d373129f274c41b565158dcfc" FOREIGN KEY ("ai_model_id") REFERENCES "ai_models"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project_compositions" DROP CONSTRAINT "FK_b3d373129f274c41b565158dcfc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_compositions" DROP CONSTRAINT "FK_9ef39dc2d0792cfbaa3c5168029"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_compositions" DROP CONSTRAINT "FK_809bdf057204c8b2cc57c2d80a3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "repositories" DROP CONSTRAINT "FK_01d0a80f46bb43811628f4174f6"`,
    );
    await queryRunner.query(`DROP TABLE "project_compositions"`);
    await queryRunner.query(
      `DROP TYPE "public"."project_compositions_push_mode_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."project_compositions_provider_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."project_compositions_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d1358d284c5c08ac0cde471c78"`,
    );
    await queryRunner.query(`DROP TABLE "repositories"`);
  }
}
