/**
 * Storybook stories for DataTable
 */

import type { Meta, StoryObj } from '@storybook/react'
import { DataTable } from '../src/components/DataTable'
import type { ColumnDef, UseListResult } from '../src/types'

const meta: Meta<typeof DataTable> = {
  title: '@ssot-ui/DataTable',
  component: DataTable,
  parameters: {
    layout: 'padded'
  },
  tags: ['autodocs']
}

export default meta
type Story = StoryObj<typeof DataTable>

// Mock data
interface Post {
  id: number
  title: string
  content: string
  author: {
    name: string
    email: string
  }
  published: boolean
  views: number
  createdAt: string
}

const mockPosts: Post[] = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  title: `Post ${i + 1}`,
  content: `This is the content of post ${i + 1}. It contains some interesting information about various topics.`,
  author: {
    name: ['John Doe', 'Jane Smith', 'Bob Johnson'][i % 3],
    email: ['john@example.com', 'jane@example.com', 'bob@example.com'][i % 3]
  },
  published: i % 2 === 0,
  views: Math.floor(Math.random() * 1000),
  createdAt: new Date(2025, 0, i + 1).toISOString()
}))

const basicColumns: ColumnDef<Post>[] = [
  { key: 'title', header: 'Title', sortable: true },
  { key: 'author.name', header: 'Author' },
  { key: 'published', header: 'Status' },
  { key: 'createdAt', header: 'Created', sortable: true }
]

// Story 1: Basic table
export const Basic: Story = {
  args: {
    data: mockPosts.slice(0, 10),
    total: 10,
    columns: basicColumns,
    pagination: 'pages',
    defaultPageSize: 10
  }
}

// Story 2: With filters
export const WithFilters: Story = {
  args: {
    data: mockPosts.slice(0, 20),
    total: 20,
    columns: basicColumns,
    searchable: ['title', 'content'],
    filterable: [
      {
        field: 'published',
        type: 'boolean',
        label: 'Published'
      },
      {
        field: 'author.name',
        type: 'enum',
        label: 'Author',
        options: [
          { label: 'John Doe', value: 'John Doe' },
          { label: 'Jane Smith', value: 'Jane Smith' },
          { label: 'Bob Johnson', value: 'Bob Johnson' }
        ]
      }
    ],
    pagination: 'pages',
    defaultPageSize: 20
  }
}

// Story 3: With sorting
export const WithSorting: Story = {
  args: {
    data: mockPosts.slice(0, 20),
    total: 20,
    columns: [
      { key: 'title', header: 'Title', sortable: true },
      { key: 'author.name', header: 'Author', sortable: true },
      { key: 'views', header: 'Views', sortable: true, align: 'right' },
      { key: 'createdAt', header: 'Created', sortable: true }
    ],
    defaultSort: [{ field: 'createdAt', dir: 'desc' }],
    pagination: 'pages'
  }
}

// Story 4: Custom cell renderers
export const CustomCells: Story = {
  args: {
    data: mockPosts.slice(0, 15),
    total: 15,
    columns: [
      {
        key: 'title',
        header: 'Title',
        cellRender: (value, post) => (
          <a href={`#/posts/${post.id}`} className="font-medium text-primary-600 hover:underline">
            {value}
          </a>
        )
      },
      {
        key: 'author.name',
        header: 'Author',
        cellRender: (name, post) => (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
              {name.charAt(0)}
            </div>
            <div>
              <div className="font-medium">{name}</div>
              <div className="text-xs text-neutral-500">{post.author.email}</div>
            </div>
          </div>
        )
      },
      {
        key: 'published',
        header: 'Status',
        cellRender: (published) => (
          <span className={`
            inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
            ${published ? 'bg-success-light text-success-dark' : 'bg-neutral-200 text-neutral-700'}
          `}>
            {published ? '✓ Published' : '○ Draft'}
          </span>
        )
      },
      {
        key: 'views',
        header: 'Views',
        align: 'right',
        cellRender: (views) => views.toLocaleString()
      }
    ],
    pagination: 'pages'
  }
}

// Story 5: With mocked latency
export const MockedLatency: Story = {
  render: () => {
    // Simulate hook with delay
    const useMockList = (): UseListResult<Post> => {
      const [isLoading, setIsLoading] = React.useState(true)
      const [data, setData] = React.useState<Post[]>([])
      
      React.useEffect(() => {
        const timer = setTimeout(() => {
          setData(mockPosts.slice(0, 20))
          setIsLoading(false)
        }, 2000)
        
        return () => clearTimeout(timer)
      }, [])
      
      return {
        data,
        total: 50,
        isLoading,
        error: null,
        refetch: () => {}
      }
    }
    
    return (
      <DataTable
        hook={useMockList}
        columns={basicColumns}
        pagination="pages"
      />
    )
  }
}

// Import React for the mocked latency story
import * as React from 'react'

