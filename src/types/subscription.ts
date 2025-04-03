export interface Subscription {
  id: number;
  paymentId: string | undefined;
  paymentDate: Date | undefined;
}

export const DEFAULT_SUBSCRIPTION_ID = 1;