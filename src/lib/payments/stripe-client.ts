import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

/**
 * Get or create Stripe instance (lazy initialization)
 * This prevents initialization during build time when env vars might not be available
 */
export function getStripeClient(): Stripe {
  if (!stripeInstance) {
    const apiKey = process.env.STRIPE_SECRET_KEY
    if (!apiKey) {
      throw new Error(
        'STRIPE_SECRET_KEY environment variable is not set. ' +
        'Please configure Stripe API key before using payment features.'
      )
    }
    stripeInstance = new Stripe(apiKey, {
      apiVersion: '2025-09-30.clover',
    })
  }
  return stripeInstance
}
