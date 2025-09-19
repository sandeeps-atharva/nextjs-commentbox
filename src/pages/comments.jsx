import withAuth from "@/utils/withAuth";

import CommentSection from "@/Components/CommentSection";
import AdminLayout from "@/Components/_layout";

function AdminCommentsPage() {
  return (
    <AdminLayout>
      <CommentSection />
    </AdminLayout>
  );
}

export default withAuth(AdminCommentsPage, { requireAdmin: true });
