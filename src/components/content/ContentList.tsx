'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { ContentStatus } from '@/lib/content/types'

interface ContentListProps {
  initialContents: Array<{
    id: string
    title: string
    status: ContentStatus
    complianceScore: number | null
    updatedAt: Date
    createdBy: { name: string | null; email: string }
  }>
}

export function ContentList({ initialContents }: ContentListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredContents = statusFilter === 'all'
    ? initialContents
    : initialContents.filter(c => c.status === statusFilter)

  const getStatusBadgeColor = (status: ContentStatus) => {
    const colors: Record<ContentStatus, string> = {
      DRAFT: 'bg-gray-200 text-gray-800',
      SUBMITTED: 'bg-blue-200 text-blue-800',
      IN_REVIEW: 'bg-yellow-200 text-yellow-800',
      APPROVED: 'bg-green-200 text-green-800',
      REJECTED: 'bg-red-200 text-red-800',
    }
    return colors[status]
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded ${statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          All
        </button>
        {['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded ${statusFilter === status ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-3 text-left">Title</th>
              <th className="border p-3 text-left">Status</th>
              <th className="border p-3 text-center">Compliance</th>
              <th className="border p-3 text-left">Last Modified</th>
              <th className="border p-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredContents.length === 0 ? (
              <tr>
                <td colSpan={5} className="border p-4 text-center text-gray-500">
                  No content found
                </td>
              </tr>
            ) : (
              filteredContents.map(content => (
                <tr key={content.id} className="hover:bg-gray-50">
                  <td className="border p-3 font-medium">{content.title}</td>
                  <td className="border p-3">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusBadgeColor(content.status)}`}>
                      {content.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="border p-3 text-center">
                    {content.complianceScore !== null ? (
                      <span className={content.complianceScore >= 70 ? 'text-green-600' : 'text-yellow-600'}>
                        {content.complianceScore}/100
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="border p-3 text-sm text-gray-600">
                    {new Date(content.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="border p-3">
                    <Link
                      href={content.status === 'DRAFT' ? `/dashboard/content/${content.id}/edit` : `/dashboard/content/list`}
                      className="text-blue-600 hover:underline"
                    >
                      {content.status === 'DRAFT' ? 'Edit' : 'View'}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
