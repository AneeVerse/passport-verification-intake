import { prisma } from "@/lib/prisma";
import LocationsClientPage from "./LocationsClientPage";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const locations = await prisma.location.findMany({
    orderBy: {
      location_id: "desc",
    },
  });

  return <LocationsClientPage initialLocations={locations} />;
}
