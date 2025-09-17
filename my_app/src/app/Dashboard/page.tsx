// app/dashboard/page.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DashboardRedirect() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role || 'VIEWER';
  redirect(`/dashboard/${role.toLowerCase()}`);
  return null;
}