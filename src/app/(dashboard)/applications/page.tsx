import { getApplications } from "@/app/actions/applications";
import ApplicationsClientPage from "./ApplicationsClientPage";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const session = await auth();
  const userRole = (session?.user as any)?.role || "Agent";

  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const search = params.search || "";
  const status = params.status || "";

  const data = await getApplications({ page, search, status });

  return (
    <ApplicationsClientPage
      initialData={data.items as any}
      totalPages={data.pages}
      currentPage={page}
      initialSearch={search}
      initialStatus={status}
      userRole={userRole}
    />
  );
}
