import { redirect } from "next/navigation"

interface PeriodIndexPageProps {
  params: Promise<{ id: string }>
}

export default async function PeriodIndexPage({ params }: PeriodIndexPageProps) {
  const { id } = await params
  redirect(`/admin/periods/${id}/overview`)
}
