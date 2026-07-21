import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await requireAdmin();
  return (
    <div className="content">
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-12">
            <h4>Vítejte, {user.first_name || user.email}</h4>
            <p>RubyQ administrace webu.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
