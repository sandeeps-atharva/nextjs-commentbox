import withAuth from "@/utils/withAuth";
import Header from "@/Components/Header";
import CommentSection from "@/Components/CommentSection";

function HomePage() {
  return (
    <>
      <Header />
      <CommentSection />
    </>
  );
}

export default withAuth(HomePage, { requireAdmin: false });
