import { ContentList } from '@/components/content/ContentList'
import { listContentAction } from '@/lib/actions/content'
import Link from 'next/link'

export default async function ContentListPage() {
  const { success, contents } = await listContentAction()

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Content Dashboard</h1>
        <Link
          href="/dashboard/content/create"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Create Content
        </Link>
      </div>

      {success ? (
        <ContentList initialContents={contents} />
      ) : (
        <div className="text-red-600">Failed to load content</div>
      )}
    </div>
  )
}
