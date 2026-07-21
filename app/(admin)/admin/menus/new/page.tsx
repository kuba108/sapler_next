import { requirePolicy } from '@/lib/admin-auth';
import { Breadcrumbs, PageContent } from '@/components/admin/ui';
import NewMenuForm from './NewMenuForm';

export const dynamic = 'force-dynamic';

export default async function NewMenu() {
  await requirePolicy('menu', 'create');
  return (
    <>
      <Breadcrumbs items={[{ label: 'Menu', href: '/admin/menus' }, { label: 'Nové menu' }]} />
      <PageContent>
        <NewMenuForm />
      </PageContent>
    </>
  );
}
