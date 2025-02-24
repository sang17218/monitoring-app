import { Request, Response, Router } from "express";
import v4 from "uuid4";

export const TodoRouter = Router();

interface Todo {
  id: string;
  title: string;
  notes: string;
  completed: boolean;
}

let todos: Todo[] = []; // dummy In-memory storage

TodoRouter.get("/", (req: Request, res: Response) => {
  console.log("get all");
  res.json(todos);
});

TodoRouter.post("/", (req: Request, res: Response) => {
  const { title, notes } = req.body as Pick<Todo, "title" | "notes">;

  if (!title) {
    res.status(400).json({ error: "Title is required" });
    return;
  }

  if (title.toLowerCase() === "fail") {
    res.status(500).json({ error: "Intentional server error" }); // Simulated server error (500)
    return;
  }

  const newTodo: Todo = {
    id: v4(),
    title,
    completed: false,
    notes: notes || "",
  };
  todos.push(newTodo);

  res.status(201).json(newTodo);
});

TodoRouter.get("/:id", (req: Request, res: Response) => {
  const id = req.params.id;
  const todo = todos.find((t) => t.id === id);

  if (!todo) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }

  res.json(todo);
});

TodoRouter.put("/:id", (req: Request, res: Response) => {
  const id = req.params.id;
  const todo = todos.find((t) => t.id === id);

  if (!todo) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }

  if (req.body.title === "fail") {
    res.status(500).json({ error: "Simulated internal error" }); // Simulated 500 error
    return;
  }

  todo.title = req.body.title || todo.title;
  todo.completed = req.body.completed ?? todo.completed;
  todo.notes = req.body.notes || todo.notes;

  res.json(todo);
});

TodoRouter.delete("/:id", (req: Request, res: Response) => {
  const id = req.params.id;
  const index = todos.findIndex((t) => t.id === id);

  if (index === -1) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }

  todos.splice(index, 1);
  res.status(204).send();
});
