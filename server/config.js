// Riders Plus configuration: membership tiers, limits and fees in one place.
// Change values here and restart the server. The admin panel shows the current values.
module.exports = {
  appName: 'Riders Plus',
  operator: 'Ride With Us Retreats',
  contactEmail: 'info@ridewithusretreats.com',
  website: 'https://ridewithusretreats.com',

  // Sign-up is free. Matching is free for now.
  tiers: {
    basic: {
      label: 'Basic',
      price: 'Free',
      dailySwipeLimit: 20,           // likes + passes per calendar day (server time)
      canSeeWhoLikedYou: false,      // see incoming likes before matching
      filters: ['sport'],            // filters available in Find your rider
      maxProfilePhotos: 3,
      freeEventPostsPerMonth: 1,     // free (no fee) event posts per calendar month
    },
    plus: {
      label: 'Plus',
      price: 'Coming soon',          // no payment for Plus yet
      dailySwipeLimit: null,         // null = unlimited
      canSeeWhoLikedYou: true,
      filters: ['sport', 'level', 'island'],
      maxProfilePhotos: 10,
      freeEventPostsPerMonth: null,
    },
  },
  plusFeatures: [
    'Unlimited daily likes',
    'See who liked you before you match',
    'Filter riders by level and island',
    'Up to 10 profile photos',
    'Unlimited free event posts',
  ],

  // Event listings
  paidEventMinListingFeeEur: 5,
  featuredBoostEur: 15,

  // Grom sponsorship amounts (test mode)
  gromSponsorAmountsEur: [10, 25, 50],

  // Crew matching age gate
  minAgeForMatching: 18,

  // Payments: 'test' unless STRIPE_SECRET_KEY is set in the environment.
  // A blank value (Render leaves an empty secret box as "") stays in test mode.
  paymentsMode: (process.env.STRIPE_SECRET_KEY || '').trim() ? 'stripe' : 'test',
};
