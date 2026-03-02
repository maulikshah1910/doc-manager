---
description: backend service lifecycle management — always kill agent-started instances before handing back control
---

## Rule: Backend Process Lifecycle

**The agent MUST follow this rule without being reminded:**

Whenever the agent starts the backend server (via `npm start` or `nest start`) during a task, it MUST kill that process before finishing the task and returning control to the user.

### Why
The user runs the backend themselves via `npm start`. If the agent leaves a dangling backend process on port 4000, the user gets `EADDRINUSE` errors.

### Steps to always do when stopping work

// turbo
1. Free port 4000 before ending any task that started the backend:
```bash
lsof -ti:4000 | xargs kill -9 2>/dev/null; echo "Port 4000 freed"
```

// turbo
2. Confirm the port is free by checking no process is running:
```bash
lsof -i:4000 || echo "Port 4000 is free"
```

### Do NOT do this
- ❌ Start the backend with `npm start` and leave it running when the task ends
- ❌ Ask the user to kill the backend themselves
- ❌ Assume the user's terminal backend is doing the same job

### Verification note
If the agent starts the backend to verify something (e.g., check routes or test an endpoint), it should:
1. Complete verification
2. Kill the backend process immediately after
3. Note in the notify_user message: "Port 4000 has been freed — you can run `npm start` normally."
