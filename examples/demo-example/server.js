import express from 'express';
import { todoRoutes } from './gen/routes/todo/todo.routes.js';
import { createTodo, getTodos } from './gen/controllers/todo/todo.controller.js';

const app = express();
app.use(express.json());

// Simple in-memory store for demo
const todos = [];
let nextId = 1;

// Override generated stubs with real implementations
const realCreateTodo = (dto) => {
  const todo = { id: nextId++, ...dto, createdAt: new Date() };
  todos.push(todo);
  return todo;
};

const realGetTodos = () => {
  return todos;
};

const realGetTodoById = (id) => {
  return todos.find(t => t.id === parseInt(id));
};

const realUpdateTodo = (id, dto) => {
  const index = todos.findIndex(t => t.id === parseInt(id));
  if (index >= 0) {
    todos[index] = { ...todos[index], ...dto };
    return todos[index];
  }
  return null;
};

const realDeleteTodo = (id) => {
  const index = todos.findIndex(t => t.id === parseInt(id));
  if (index >= 0) {
    return todos.splice(index, 1)[0];
  }
  return null;
};

// API Routes
app.get('/api/todos', (req, res) => {
  res.json(realGetTodos());
});

app.post('/api/todos', (req, res) => {
  const todo = realCreateTodo(req.body);
  res.status(201).json(todo);
});

app.get('/api/todos/:id', (req, res) => {
  const todo = realGetTodoById(req.params.id);
  if (todo) {
    res.json(todo);
  } else {
    res.status(404).json({ error: 'Todo not found' });
  }
});

app.put('/api/todos/:id', (req, res) => {
  const todo = realUpdateTodo(req.params.id, req.body);
  if (todo) {
    res.json(todo);
  } else {
    res.status(404).json({ error: 'Todo not found' });
  }
});

app.delete('/api/todos/:id', (req, res) => {
  const todo = realDeleteTodo(req.params.id);
  if (todo) {
    res.json(todo);
  } else {
    res.status(404).json({ error: 'Todo not found' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Demo Todo API is running!' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📋 API endpoints:`);
  console.log(`   GET    /api/todos       - List all todos`);
  console.log(`   POST   /api/todos       - Create a todo`);
  console.log(`   GET    /api/todos/:id   - Get one todo`);
  console.log(`   PUT    /api/todos/:id   - Update a todo`);
  console.log(`   DELETE /api/todos/:id   - Delete a todo`);
  console.log(`   GET    /health          - Health check`);
});

