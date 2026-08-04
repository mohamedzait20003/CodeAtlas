import { MigrationInterface, QueryRunner } from 'typeorm';

export class Billing1785643047441 implements MigrationInterface {
  name = 'Billing1785643047441';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "plan_prices" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "plan_id" uuid NOT NULL,
                "gateway" text NOT NULL,
                "interval" text NOT NULL,
                "price_ref" text NOT NULL,
                "amount" integer NOT NULL,
                "currency" text NOT NULL DEFAULT 'usd',
                CONSTRAINT "PK_69b05dce9891d42a3d0fc77eec1" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_4ce73ad2f1ff18a716a8fd93ad" ON "plan_prices" ("plan_id", "gateway", "interval")
        `);
    await queryRunner.query(`
            CREATE TABLE "payment_events" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "gateway" text NOT NULL,
                "event_id" text NOT NULL,
                "type" text NOT NULL,
                "payload" jsonb NOT NULL,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "processed_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_9f1d16fc78b33e676940a32e8b5" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_81109343a8a113cb8af6a1f817" ON "payment_events" ("gateway", "event_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "subscriptions" DROP COLUMN "stripe_subscription_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "user_profiles"
            ADD "country" text
        `);
    await queryRunner.query(`
            ALTER TABLE "subscriptions"
            ADD "gateway" text
        `);
    await queryRunner.query(`
            ALTER TABLE "subscriptions"
            ADD "gateway_ref" text
        `);
    await queryRunner.query(`
            ALTER TABLE "subscriptions"
            ADD "interval" text
        `);
    await queryRunner.query(`
            ALTER TABLE "subscriptions"
            ADD "cancel_at_period_end" boolean NOT NULL DEFAULT false
        `);
    await queryRunner.query(`
            ALTER TABLE "subscriptions"
            ADD "effective_end_at" TIMESTAMP WITH TIME ZONE
        `);
    await queryRunner.query(`
            ALTER TABLE "plan_prices"
            ADD CONSTRAINT "FK_486db649897ac5901b8e93e5b7d" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "plan_prices" DROP CONSTRAINT "FK_486db649897ac5901b8e93e5b7d"
        `);
    await queryRunner.query(`
            ALTER TABLE "subscriptions" DROP COLUMN "effective_end_at"
        `);
    await queryRunner.query(`
            ALTER TABLE "subscriptions" DROP COLUMN "cancel_at_period_end"
        `);
    await queryRunner.query(`
            ALTER TABLE "subscriptions" DROP COLUMN "interval"
        `);
    await queryRunner.query(`
            ALTER TABLE "subscriptions" DROP COLUMN "gateway_ref"
        `);
    await queryRunner.query(`
            ALTER TABLE "subscriptions" DROP COLUMN "gateway"
        `);
    await queryRunner.query(`
            ALTER TABLE "user_profiles" DROP COLUMN "country"
        `);
    await queryRunner.query(`
            ALTER TABLE "subscriptions"
            ADD "stripe_subscription_id" text
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_81109343a8a113cb8af6a1f817"
        `);
    await queryRunner.query(`
            DROP TABLE "payment_events"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_4ce73ad2f1ff18a716a8fd93ad"
        `);
    await queryRunner.query(`
            DROP TABLE "plan_prices"
        `);
  }
}
