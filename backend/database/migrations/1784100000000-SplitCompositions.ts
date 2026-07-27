import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Splits the single `generations` table (discriminated by `kind`) into one table
 * per flow:
 *   • persona_compositions  ← kind='profile'      (has resume_id, no repo)
 *   • project_compositions  ← kind='repo_readme'  (has repo_id NOT NULL)
 * Both reuse the shared enum types (generation_status_enum / llm_provider_enum /
 * push_mode_enum). Existing rows are copied across by kind, then the old table +
 * the now-unused generation_kind_enum are dropped. Fully reversible.
 */
export class SplitCompositions1784100000000 implements MigrationInterface {
  name = 'SplitCompositions1784100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "persona_compositions" (
        "id"            UUID        NOT NULL DEFAULT gen_random_uuid(),
        "user_id"       UUID        NOT NULL,
        "resume_id"     UUID,
        "intent"        TEXT,
        "status"        "public"."generation_status_enum" NOT NULL DEFAULT 'queued',
        "phase"         TEXT,
        "ai_model_id"   UUID,
        "provider"      "public"."llm_provider_enum",
        "model"         TEXT,
        "push_mode"     "public"."push_mode_enum"         NOT NULL DEFAULT 'manual',
        "generated_md"  TEXT,
        "pr_url"        TEXT,
        "commit_sha"    TEXT,
        "input_tokens"  INT,
        "output_tokens" INT,
        "error"         TEXT,
        "created_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),
        "completed_at"  TIMESTAMPTZ,
        CONSTRAINT "PK_persona_compositions"          PRIMARY KEY ("id"),
        CONSTRAINT "FK_persona_compositions_profile"  FOREIGN KEY ("user_id")     REFERENCES "user_profiles"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_persona_compositions_resume"   FOREIGN KEY ("resume_id")   REFERENCES "resumes"("id")       ON DELETE SET NULL,
        CONSTRAINT "FK_persona_compositions_ai_model" FOREIGN KEY ("ai_model_id") REFERENCES "ai_models"("id")     ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "project_compositions" (
        "id"            UUID        NOT NULL DEFAULT gen_random_uuid(),
        "user_id"       UUID        NOT NULL,
        "repo_id"       UUID        NOT NULL,
        "intent"        TEXT,
        "status"        "public"."generation_status_enum" NOT NULL DEFAULT 'queued',
        "phase"         TEXT,
        "ai_model_id"   UUID,
        "provider"      "public"."llm_provider_enum",
        "model"         TEXT,
        "push_mode"     "public"."push_mode_enum"         NOT NULL DEFAULT 'manual',
        "generated_md"  TEXT,
        "pr_url"        TEXT,
        "commit_sha"    TEXT,
        "input_tokens"  INT,
        "output_tokens" INT,
        "error"         TEXT,
        "created_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),
        "completed_at"  TIMESTAMPTZ,
        CONSTRAINT "PK_project_compositions"          PRIMARY KEY ("id"),
        CONSTRAINT "FK_project_compositions_profile"  FOREIGN KEY ("user_id")     REFERENCES "user_profiles"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_project_compositions_repo"     FOREIGN KEY ("repo_id")     REFERENCES "repositories"("id")  ON DELETE CASCADE,
        CONSTRAINT "FK_project_compositions_ai_model" FOREIGN KEY ("ai_model_id") REFERENCES "ai_models"("id")     ON DELETE SET NULL
      )
    `);

    const COLS = `"id", "user_id", "intent", "status", "phase", "ai_model_id",
      "provider", "model", "push_mode", "generated_md", "pr_url", "commit_sha",
      "input_tokens", "output_tokens", "error", "created_at", "completed_at"`;

    await queryRunner.query(`
      INSERT INTO "persona_compositions" (${COLS}, "resume_id")
      SELECT ${COLS}, "resume_id" FROM "generations" WHERE "kind" = 'profile'
    `);
    await queryRunner.query(`
      INSERT INTO "project_compositions" (${COLS}, "repo_id")
      SELECT ${COLS}, "repo_id" FROM "generations" WHERE "kind" = 'repo_readme'
    `);

    await queryRunner.query(`DROP TABLE "generations"`);
    await queryRunner.query(`DROP TYPE "public"."generation_kind_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."generation_kind_enum" AS ENUM ('repo_readme', 'profile')
    `);
    await queryRunner.query(`
      CREATE TABLE "generations" (
        "id"            UUID        NOT NULL DEFAULT gen_random_uuid(),
        "user_id"       UUID        NOT NULL,
        "kind"          "public"."generation_kind_enum" NOT NULL DEFAULT 'repo_readme',
        "repo_id"       UUID,
        "resume_id"     UUID,
        "intent"        TEXT,
        "status"        "public"."generation_status_enum" NOT NULL DEFAULT 'queued',
        "phase"         TEXT,
        "ai_model_id"   UUID,
        "provider"      "public"."llm_provider_enum",
        "model"         TEXT,
        "push_mode"     "public"."push_mode_enum"         NOT NULL DEFAULT 'manual',
        "generated_md"  TEXT,
        "pr_url"        TEXT,
        "commit_sha"    TEXT,
        "input_tokens"  INT,
        "output_tokens" INT,
        "error"         TEXT,
        "created_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),
        "completed_at"  TIMESTAMPTZ,
        CONSTRAINT "PK_generations"         PRIMARY KEY ("id"),
        CONSTRAINT "FK_generations_profile" FOREIGN KEY ("user_id")     REFERENCES "user_profiles"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_generations_repo"    FOREIGN KEY ("repo_id")     REFERENCES "repositories"("id")  ON DELETE CASCADE,
        CONSTRAINT "FK_generations_resume"  FOREIGN KEY ("resume_id")   REFERENCES "resumes"("id")       ON DELETE SET NULL,
        CONSTRAINT "FK_generations_ai_model" FOREIGN KEY ("ai_model_id") REFERENCES "ai_models"("id")    ON DELETE SET NULL,
        CONSTRAINT "CHK_generations_kind_repo" CHECK (
          ("kind" = 'repo_readme' AND "repo_id" IS NOT NULL)
          OR ("kind" = 'profile' AND "repo_id" IS NULL)
        )
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_generations_user_kind" ON "generations" ("user_id", "kind")`,
    );

    const COLS = `"id", "user_id", "intent", "status", "phase", "ai_model_id",
      "provider", "model", "push_mode", "generated_md", "pr_url", "commit_sha",
      "input_tokens", "output_tokens", "error", "created_at", "completed_at"`;

    await queryRunner.query(`
      INSERT INTO "generations" (${COLS}, "kind", "resume_id")
      SELECT ${COLS}, 'profile', "resume_id" FROM "persona_compositions"
    `);
    await queryRunner.query(`
      INSERT INTO "generations" (${COLS}, "kind", "repo_id")
      SELECT ${COLS}, 'repo_readme', "repo_id" FROM "project_compositions"
    `);

    await queryRunner.query(`DROP TABLE "project_compositions"`);
    await queryRunner.query(`DROP TABLE "persona_compositions"`);
  }
}
