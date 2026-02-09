import { ContentEditor } from '@/components/content/ContentEditor'
import { getContentAction } from '@/lib/actions/content'
import { redirect } from 'next/navigation'

export default async function EditContentPage({ params }: { params: { contentId: string } }) {
  const { success, content } = await getContentAction({ contentId: params.contentId })

  if (!success || !content) {
    redirect('/dashboard/content/list')
  }

  if (content.status !== 'DRAFT') {
    redirect(`/dashboard/content/list`)
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Edit Content</h1>
      <ContentEditor initialContent={content} />
    </div>
  )
}
