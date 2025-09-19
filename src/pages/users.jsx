import AdminLayout from "@/Components/_layout";
import UserTable from "@/Components/UserTable";
import withAuth from "@/utils/withAuth";

function AdminUsersPage() {
  return (
    <AdminLayout>
      <UserTable />
    </AdminLayout>
  );
}

export default withAuth(AdminUsersPage, { requireAdmin: true });
