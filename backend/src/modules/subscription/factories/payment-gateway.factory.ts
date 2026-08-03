import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { PaymentGateway } from '../adapters/payment-gateway';
import { StripeGateway } from '../adapters/stripe.gateway';

/**
 * Region → gateway key. The single place that decides which gateway (and
 * therefore which hosted checkout + payment methods) a user sees. Add a region
 * by adding a row here and injecting its adapter below.
 */
const REGION_GATEWAYS: Record<string, string> = {
  US: 'stripe',
  EG: 'paymob',
  SA: 'hyperpay',
};

const DEFAULT_GATEWAY = 'stripe';

/**
 * Resolves a region to its payment-gateway adapter (mirrors `LlmProviderFactory`,
 * which resolves a provider to a chat model).
 *
 * Adapters are injected as DI singletons and handed back as-is — never
 * constructed per call: a gateway client owns a pooled HTTP agent, so one
 * instance per process is both cheaper and correct.
 */
@Injectable()
export class PaymentGatewayFactory {
  private readonly byKey = new Map<string, PaymentGateway>();

  // Adapters are registered here (the composition root). Add a constructor
  // param + register() call to wire another gateway.
  constructor(
    private readonly config: ConfigService,
    stripe: StripeGateway,
  ) {
    this.register(stripe);
  }

  private register(gateway: PaymentGateway): void {
    this.byKey.set(gateway.key, gateway);
  }

  /**
   * The adapter for a region, or a clear error if that region isn't wired yet.
   * A missing region (user has no country) falls back to `billing.defaultRegion`.
   */
  resolveByRegion(region?: string | null): PaymentGateway {
    const resolved =
      region ?? this.config.get<string>('billing.defaultRegion') ?? 'US';
    const key = REGION_GATEWAYS[resolved.toUpperCase()] ?? DEFAULT_GATEWAY;
    const gateway = this.byKey.get(key);
    if (!gateway) {
      throw new BadRequestException(
        'Online payments are not available in your region yet.',
      );
    }
    return gateway;
  }
}
