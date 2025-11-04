// Simple Demo Server for SSOT Codegen Example
// This demonstrates the API generated from our Todo model

import express from 'express';

const app = express();
app.use(express.json());

// In-memory store (in production, use database)
const todos = [];
let nextId = 1;

console.log('🚀 Starting SSOT Codegen Demo Server...\n');
console.log('📋 Generated API Endpoints:');

// GET /todos - List all todos
app.get('/todos', (req, res) => {
  console.log('✅ GET /todos - Listing all todos');
  res.json({ data: todos, count: todos.length });
});

// POST /todos - Create a new todo
app.post('/todos', (req, res) => {
  const { title, completed = false } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  const todo = {
    id: nextId++,
    title,
    completed,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  todos.push(todo);
  console.log(`✅ POST /todos - Created:`, todo);
  res.status(201).json(todo);
});

// GET /todos/:id - Get a specific todo
app.get('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const todo = todos.find(t => t.id === id);
  
  if (!todo) {
    console.log(`❌ GET /todos/${id} - Not found`);
    return res.status(404).json({ error: 'Todo not found' });
  }
  
  console.log(`✅ GET /todos/${id} - Found:`, todo);
  res.json(todo);
});

// PUT /todos/:id - Update a todo
app.put('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = todos.findIndex(t => t.id === id);
  
  if (index === -1) {
    console.log(`❌ PUT /todos/${id} - Not found`);
    return res.status(404).json({ error: 'Todo not found' });
  }
  
  todos[index] = {
    ...todos[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  console.log(`✅ PUT /todos/${id} - Updated:`, todos[index]);
  res.json(todos[index]);
});

// DELETE /todos/:id - Delete a todo
app.delete('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = todos.findIndex(t => t.id === id);
  
  if (index === -1) {
    console.log(`❌ DELETE /todos/${id} - Not found`);
    return res.status(404).json({ error: 'Todo not found' });
  }
  
  const deleted = todos.splice(index, 1)[0];
  console.log(`✅ DELETE /todos/${id} - Deleted:`, deleted);
  res.json({ message: 'Todo deleted', todo: deleted });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'SSOT Codegen Demo API',
    endpoints: 5,
    todos: todos.length
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`\n✅ Demo API Server running on http://localhost:${PORT}`);
  console.log(`\n📚 Available Endpoints:`);
  console.log(`   GET    http://localhost:${PORT}/todos       - List all todos`);
  console.log(`   POST   http://localhost:${PORT}/todos       - Create a todo`);
  console.log(`   GET    http://localhost:${PORT}/todos/:id   - Get one todo`);
  console.log(`   PUT    http://localhost:${PORT}/todos/:id   - Update a todo`);
  console.log(`   DELETE http://localhost:${PORT}/todos/:id   - Delete a todo`);
  console.log(`   GET    http://localhost:${PORT}/health      - Health check`);
  console.log(`\n🎯 Try it: curl http://localhost:${PORT}/health\n`);
});

