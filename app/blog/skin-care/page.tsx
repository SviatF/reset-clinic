import BlogCategoryPage, { buildBlogCategoryMetadata } from "../../../components/BlogCategoryPage";
export const dynamic = "force-dynamic";
export async function generateMetadata() { return buildBlogCategoryMetadata("skin-care"); }
export default function Page() { return <BlogCategoryPage slug="skin-care" />; }
