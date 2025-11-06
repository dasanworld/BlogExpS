import { AdvertiserDashboard } from "@/features/advertiser/dashboard/components/advertiser-dashboard";
import { getAdvertiserProfileServer, getMyCampaignsServer, getMyCampaignCountsServer } from "@/features/advertiser/dashboard/server/queries";

export default async function AdvertisersDashboardPage() {
  const profile = await getAdvertiserProfileServer();
  const list = await getMyCampaignsServer({ status: 'all', page: 1, pageSize: 10, sort: 'recent' });
  const counts = await getMyCampaignCountsServer();

  const initialProfile = profile.ok ? profile.data : undefined;
  const initialList = list.ok ? list.data : undefined;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <AdvertiserDashboard initialProfile={initialProfile} initialList={initialList} initialCounts={counts.ok ? counts.data : undefined} />
    </div>
  );
}
