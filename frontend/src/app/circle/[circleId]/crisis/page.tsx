import { redirect } from 'next/navigation'

export default function CrisisPage({ params }: { params: { circleId: string } }) {
  redirect(`/circle/${params.circleId}`)
}
