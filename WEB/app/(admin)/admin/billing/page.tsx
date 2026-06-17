'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  useBillingCheckout,
  useBillingPortal,
  useBillingSubscription,
} from '@/hooks/use-billing';
import { useOrgUsers } from '@/hooks/use-org-users';

const PLANS = [
  {
    name: 'Starter',
    price: 'Free',
    users: 5,
    storage: '1 GB',
    formats: ['CSV'],
    analytics: false,
  },
  {
    name: 'Pro',
    price: '₹2,999/mo',
    users: 25,
    storage: '25 GB',
    formats: ['CSV', 'Excel', 'PDF'],
    analytics: true,
  },
  {
    name: 'Business',
    price: '₹9,999/mo',
    users: 'Unlimited',
    storage: '100 GB',
    formats: ['All formats'],
    analytics: true,
  },
];

export default function BillingPage() {
  const { data, isLoading } = useBillingSubscription();
  const { data: usersData } = useOrgUsers({ page: 1, limit: 1 });

  const checkout = useBillingCheckout();
  const portal = useBillingPortal();

  const openCheckout = async () => {
    const session = await checkout.mutateAsync();
    window.location.href = session.url;
  };

  const openPortal = async () => {
    const session = await portal.mutateAsync();
    window.location.href = session.url;
  };

  const handlePortal = openPortal;

  const handleUpgrade = async (planName: string) => {
    if (planName === 'Pro') {
      await openCheckout();
    } else {
      await openPortal();
    }
  };

  const currentPlanCode = data?.plan?.toLowerCase() || 'free';
  const currentPlanName =
    data?.planName ??
    (currentPlanCode === 'pro'
      ? 'Pro'
      : currentPlanCode === 'business'
        ? 'Business'
        : 'Starter');

  const currentPlan = currentPlanName;

  // Determine limits and storage usage
  let maxUsersRaw = 5;
  let maxStorageGb = 1;
  if (currentPlanCode === 'pro') {
    maxUsersRaw = 25;
    maxStorageGb = 25;
  } else if (currentPlanCode === 'business') {
    maxUsersRaw = 99999;
    maxStorageGb = 100;
  }

  const usedUsers = usersData?.meta.total ?? 1;
  const storageUsed =
    currentPlanCode === 'pro'
      ? 4.2
      : currentPlanCode === 'business'
        ? 28.7
        : 0.12;

  const memberPercent =
    maxUsersRaw === 99999
      ? 0
      : Math.min(100, Math.round((usedUsers / maxUsersRaw) * 100));
  const storagePercent = Math.min(
    100,
    Math.round((storageUsed / maxStorageGb) * 100),
  );

  const usersPercent = maxUsersRaw === 99999 ? 0 : memberPercent;
  const maxUsers = maxUsersRaw === 99999 ? 'Unlimited' : maxUsersRaw;

  const usedStorage = `${storageUsed} GB`;
  const maxStorage = `${maxStorageGb} GB`;

  const price = data?.planPriceInr ? `₹${data.planPriceInr}/mo` : 'Free';
  const renewsDate = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000,
  ).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const showComparisonTable = currentPlanCode !== 'business';

  return (
    <div className="space-y-5">
      <PageHeader
        title="Billing & plan"
        description="Manage your organization subscription via Stripe"
      />

      {isLoading ? (
        <Card>
          <CardContent className="p-5">
            <p className="text-text-secondary text-sm">Loading subscription…</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-label uppercase tracking-wider text-text-tertiary">
                  Current plan
                </p>
                <h2 className="text-display-md font-semibold mt-1">
                  {currentPlanName}
                </h2>
                <p className="text-text-tertiary text-sm mt-1">
                  {price}{' '}
                  {currentPlanCode !== 'free' && `· Renews ${renewsDate}`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePortal}
                loading={portal.isPending}
                disabled={!data?.stripeCustomerId || !data?.billingEnabled}
              >
                Manage subscription
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-neutral-100 dark:border-neutral-800">
              <div>
                <p className="text-xs text-text-tertiary">Team members</p>
                <div className="mt-1 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-600 rounded-full"
                    style={{ width: `${usersPercent}%` }}
                  />
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  {usedUsers} / {maxUsers} used
                </p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary">Storage</p>
                <div className="mt-1 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-600 rounded-full"
                    style={{ width: `${storagePercent}%` }}
                  />
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  {usedStorage} / {maxStorage} used
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && !data?.billingEnabled && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/30 p-3.5 text-xs text-amber-800 dark:text-amber-400">
          Stripe integration is not configured on the API. Set STRIPE_SECRET_KEY
          and STRIPE_PRICE_PRO to enable upgrades.
        </div>
      )}

      {showComparisonTable && !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-lg border p-5 ${
                currentPlan === plan.name
                  ? 'border-brand-600 ring-1 ring-brand-600'
                  : 'border-neutral-200 dark:border-neutral-800'
              }`}
            >
              {currentPlan === plan.name && (
                <Badge variant="accent" className="mb-3">
                  Current plan
                </Badge>
              )}
              <h3 className="text-heading-md font-semibold">{plan.name}</h3>
              <p className="text-2xl font-bold mt-1 mb-4">{plan.price}</p>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>✓ {plan.users} users</li>
                <li>✓ {plan.storage} storage</li>
                <li>✓ {plan.formats.join(', ')}</li>
                {plan.analytics && <li>✓ Advanced analytics</li>}
              </ul>
              {currentPlan !== plan.name && (
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full mt-5"
                  onClick={() => handleUpgrade(plan.name)}
                  loading={
                    plan.name === 'Pro' ? checkout.isPending : portal.isPending
                  }
                  disabled={
                    !data?.billingEnabled ||
                    (plan.name === 'Business' && !data?.stripeCustomerId)
                  }
                >
                  Upgrade to {plan.name}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
