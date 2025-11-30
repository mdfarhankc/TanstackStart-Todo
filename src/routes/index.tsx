import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { EditIcon, ListTodoIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { createServerFn, useServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { todos } from '@/db/schema'
import LocalCountButton from '@/components/LocalCountButton'

const serverLoader = createServerFn({ method: 'GET' }).handler(() => {
  return db.query.todos.findMany()
})

export const Route = createFileRoute('/')({
  component: App,
  loader: () => serverLoader(),
})

function App() {
  const todos = Route.useLoaderData()
  const completedCount = todos.filter((t) => t.isComplete).length
  const totalCount = todos.length

  return (
    <div className="min-h-screen max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Todo List</h1>
          {totalCount > 0 && (
            <Badge variant="outline">
              {completedCount} of {totalCount} completed
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <LocalCountButton />
          <Button size="sm" asChild>
            <Link to="/todos/new">
              <PlusIcon />
              Add Todo
            </Link>
          </Button>
        </div>
      </div>
      <TodoListTable todos={todos} />
    </div>
  )
}

function TodoListTable({
  todos,
}: {
  todos: Array<{
    id: string
    name: string
    isComplete: boolean
    createdAt: Date
    updatedAt: Date
  }>
}) {
  if (todos.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant={'icon'}>
            <ListTodoIcon />
          </EmptyMedia>
          <EmptyTitle>No Todos</EmptyTitle>
          <EmptyDescription>Try adding a new Todo</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link to="/todos/new">
              <PlusIcon />
              Add Todo
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    )
  }
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead></TableHead>
          <TableHead>Task</TableHead>
          <TableHead>Created On</TableHead>
          <TableHead className="w-0"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {todos.map((todo) => (
          <TodoTableRow key={todo.id} {...todo} />
        ))}
      </TableBody>
    </Table>
  )
}

const deleteTodo = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await db.delete(todos).where(eq(todos.id, data.id))
  })

const toggleTodo = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string().min(1), isComplete: z.boolean() }))
  .handler(async ({ data }) => {
    await db
      .update(todos)
      .set({ isComplete: data.isComplete })
      .where(eq(todos.id, data.id))
  })

function TodoTableRow({
  id,
  name,
  isComplete,
  createdAt,
}: {
  id: string
  name: string
  isComplete: boolean
  createdAt: Date
  updatedAt: Date
}) {
  const deleteTodoFn = useServerFn(deleteTodo)
  const toggleTodoFn = useServerFn(toggleTodo)
  const router = useRouter()
  return (
    <TableRow
      onClick={async (e) => {
        const target = e.target as HTMLElement
        if (target.closest('[data-actions]')) return
        await toggleTodoFn({ data: { id, isComplete: !isComplete } })
        router.invalidate()
      }}
    >
      <TableCell>
        <Checkbox checked={isComplete} />
      </TableCell>
      <TableCell
        className={cn(
          'font-medium',
          isComplete && 'text-muted-foreground line-through',
        )}
      >
        {name}
      </TableCell>
      <TableCell>{formatDate(createdAt)}</TableCell>
      <TableCell data-actions className="flex items-baseline justify-end gap-1">
        <Button size={'icon-sm'} variant={'secondary'} asChild>
          <Link to="/todos/$id/edit" params={{ id }}>
            <EditIcon />
          </Link>
        </Button>
        <Button
          size={'icon-sm'}
          variant={'destructive'}
          onClick={async () => {
            await deleteTodoFn({ data: { id } })
            router.invalidate()
          }}
        >
          <Trash2Icon />
        </Button>
      </TableCell>
    </TableRow>
  )
}

function formatDate(date: Date) {
  const formatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'short' })
  return formatter.format(date)
}
