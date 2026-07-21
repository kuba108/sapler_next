import { redirect } from 'next/navigation';
import { currentAdminUser } from '@/lib/auth';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const user = await currentAdminUser();
  if (user) redirect('/admin');
  return <LoginForm />;
}
