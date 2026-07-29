import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Identity domain: authentication + user-owned documents.
 *   users · user_profiles · tokens · sessions · resumes
 * (resumes lives here so the persona composition's resume_id FK resolves — the
 * persona migration runs after this one.)
 */
export class Identity1785300000000 implements MigrationInterface {
  name = 'Identity1785300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'support', 'super_admin')`,
    );
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "github_id" bigint,
        "github_login" text,
        "email" text,
        "name" text,
        "avatar_url" text,
        "github_oauth_token_enc" text,
        "password_hash" text,
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'user',
        "email_verified_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_09a2296ade1053a0cc4080bda4" ON "users" ("github_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email")`,
    );

    await queryRunner.query(`
      CREATE TABLE "user_profiles" (
        "id" uuid NOT NULL,
        "stripe_customer_id" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_1ec6662219f4605723f1e41b6cb" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE TYPE "public"."tokens_type_enum" AS ENUM('verification', 'pass_reset')`,
    );
    await queryRunner.query(`
      CREATE TABLE "tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "type" "public"."tokens_type_enum" NOT NULL,
        "token_hash" text NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "used_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_3001e89ada36263dabf1fb6210a" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_8769073e38c365f315426554ca" ON "tokens" ("user_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "sit" integer NOT NULL,
        "secret_hash" text,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "last_active_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "ip_address" text,
        "user_agent" text,
        "revoked_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_085d540d9f418cfbdc7bd55bb1" ON "sessions" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_510eb6aef663a04780e8e85439" ON "sessions" ("user_id", "sit")`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."resumes_source_enum" AS ENUM('upload', 'link')`,
    );
    await queryRunner.query(`
      CREATE TABLE "resumes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "source" "public"."resumes_source_enum" NOT NULL,
        "file_url" text NOT NULL,
        "file_name" text,
        "mime_type" text,
        "size_bytes" integer,
        "parsed_text" text,
        "parsed_json" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_9c8677802096d6baece48429d2e" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "user_profiles" ADD CONSTRAINT "FK_1ec6662219f4605723f1e41b6cb" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD CONSTRAINT "FK_8769073e38c365f315426554ca5" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "resumes" ADD CONSTRAINT "FK_dce6e1ce26d348e602f56fa6363" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "resumes" DROP CONSTRAINT "FK_dce6e1ce26d348e602f56fa6363"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" DROP CONSTRAINT "FK_8769073e38c365f315426554ca5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" DROP CONSTRAINT "FK_1ec6662219f4605723f1e41b6cb"`,
    );
    await queryRunner.query(`DROP TABLE "resumes"`);
    await queryRunner.query(`DROP TYPE "public"."resumes_source_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_510eb6aef663a04780e8e85439"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_085d540d9f418cfbdc7bd55bb1"`,
    );
    await queryRunner.query(`DROP TABLE "sessions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8769073e38c365f315426554ca"`,
    );
    await queryRunner.query(`DROP TABLE "tokens"`);
    await queryRunner.query(`DROP TYPE "public"."tokens_type_enum"`);
    await queryRunner.query(`DROP TABLE "user_profiles"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_09a2296ade1053a0cc4080bda4"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
