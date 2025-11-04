import type { Request, Response } from 'express'
import prisma from '../db.js'

// Example implementation using generated types
// In production, you'd import and use the generated DTOs:
// import type { TodoCreateDTO } from '@gen/contracts/todo'

interface TodoCreateInput {
  title: string
  completed?: boolean
}

interface TodoUpdateInput {
  title?: string
  completed?: boolean
}

export const getAllTodos = async (req: Request, res: Response) => {
  const todos = await prisma.todo.findMany({
    orderBy: { createdAt: 'desc' }
  })
  res.json(todos)
}

export const getTodoById = async (req: Request, res: Response) => {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ error: 'ID is required' })
  }
  
  const todo = await prisma.todo.findUnique({
    where: { id: parseInt(id, 10) }
  })
  
  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' })
  }
  
  return res.json(todo)
}

export const createTodo = async (req: Request, res: Response) => {
  const input: TodoCreateInput = req.body
  
  const todo = await prisma.todo.create({
    data: {
      title: input.title,
      completed: input.completed ?? false
    }
  })
  
  res.status(201).json(todo)
}

export const updateTodo = async (req: Request, res: Response) => {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ error: 'ID is required' })
  }
  
  const input: TodoUpdateInput = req.body
  
  const todo = await prisma.todo.update({
    where: { id: parseInt(id, 10) },
    data: input
  })
  
  return res.json(todo)
}

export const deleteTodo = async (req: Request, res: Response) => {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ error: 'ID is required' })
  }
  
  await prisma.todo.delete({
    where: { id: parseInt(id, 10) }
  })
  
  return res.status(204).send()
}

