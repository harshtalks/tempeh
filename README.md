# Tempeh

It consists of a wrapper fetcher factory function that you can use to create fetcher functions for your need.

let's understand with the example.

Suppose we have a Next.js app where we have a dynamic page for a workspace details that takes workspaceId as a dynamic param with the help of Zod library.

Important: You need to have zod installed for this.

Traditionally how you would do that is basically:

```tsx
<Link href={`/workspace/${workspaceId}`}>
  <Button>Workspace</Button>
</Link>
```

Now here you get little to no safety plus it breaks the dry principle. Here's how you can do it in a fully type safe manner.

```tsx
// Path: src/routes.ts

export const WorkspaceRoute = createRoute({
  fn: ({ workspaceId }) => `/workspace/${workspaceId}`,
  name: "WorkspaceRoute",
  paramsSchema: object({
    workspaceId: string(),
  }),
  options: { internal: true },
});

// Path: src/index.ts
// import { WorkspaceRoute } from "./routes.ts";

<Link href={WorkspaceRoute({ workspaceId: "123" })}>
  <Button>Workspace</Button>
</Link>;
```

Or you can use our declarative routing approach as following:

```tsx
<WorkspaceRoute.Link params={{ workspaceId: "123" }}>
  <Button>Workspace</Button>
</WorkspaceRoute.Link>
```

Package also serves the custom fetcher function generator to generate small async fetcher functions. Example:

```ts
// this fetcher creates a function to fetch the todo from json mock api
const getTodo = createEndPoint({
  httpMethod: "GET",
  path: createRoute({
    name: "getTodos",
    fn: ({ todoId }) => `/todos/${todoId}`,
    options: {
      internal: false,
      baseUrl: "https://jsonplaceholder.typicode.com",
    },
    paramsSchema: object({ todoId: number() }),
  }),
  SafeResponse: true,
  responseSchema: object({
    userId: number(),
    id: number(),
    title: string(),
    completed: boolean(),
  }),
  requestConfig: {
    headers: {
      "x-custom-header": "custom-value",
    },
  },
});

// iife to invoke the function and display result on console
(async () => {
  const todos = await getTodo({
    params: {
      todoId: 1,
    },
  });

  console.log(todos);
})();
```
