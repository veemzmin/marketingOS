import { ContentEditor } from '@/components/content/ContentEditor'

export default function CreateContentPage() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create Content</h1>
      <ContentEditor />
    </div>
  )
}
