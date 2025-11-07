import { getAdvertiserProfileServer } from "@/features/advertiser/profile/server/getProfile";
import { AdvertiserProfileForm } from "@/features/advertiser/profile/components/advertiser-profile-form";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdvertiserProfilePage() {
  const profile = await getAdvertiserProfileServer();

  if (!profile.ok && profile.reason === "UNAUTHENTICATED") {
    redirect("/login?redirectedFrom=/advertisers/profile");
  }

  return (
    <AdvertiserProfileForm
      initialValues={{
        companyName: profile.ok ? profile.data.companyName ?? "" : "",
        location: profile.ok ? profile.data.location ?? "" : "",
        category: profile.ok ? profile.data.category ?? "" : "",
        businessRegistrationNumber: profile.ok ? profile.data.businessRegistrationNumber ?? "" : "",
      }}
      initialStatus={
        profile.ok
          ? {
              profileCompleted: profile.data.profileCompleted ?? false,
              verificationStatus: profile.data.verificationStatus ?? "pending",
            }
          : undefined
      }
    />
  );
}
