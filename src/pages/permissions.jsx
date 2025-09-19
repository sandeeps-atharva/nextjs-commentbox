import AdminLayout from "@/Components/_layout";
import RolePermissionManager from "@/Components/RolePermissionManager";
import withAuth from "@/utils/withAuth";

function AdminPermissionsPage() {
  return (
    <AdminLayout>
      <RolePermissionManager />
    </AdminLayout>
  );
}

export default withAuth(AdminPermissionsPage, { requireAdmin: true });
