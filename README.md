# Tempeh

Docs: https://tempeh-docs.vercel.app


#### Important

use [tempeh-cli](https://github.com/harshtalks/tempeh-cli) to fasten up the process 

## Typesafe server actions support, and useRouter with type safety.

https://tempeh-docs.vercel.app/server-actions

<hr/>

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

#### Tempeh is Typescript utility library to manage your routes in a declarative manner

To get started with Tempeh, you need to define a global config. This design pattern is chosen for following reasons:

- Tempeh stores all your routes under the hood to keep track of params and search params and for parsing them on demand.
- Tempeh also stores all your additional base urls so that you can always decide which url to forward to in a type-safe manner.
- Tempeh also takes certain configuration props (formatting of zod errors) to make sure your errors are more readable.

Here we define our root schema:

```tsx
// Path: src/routes.ts

// You should only have a single `createRoute` constant across your function as this will make sure you do not have same named routes multiple times. It tracks the params internally.

const { createRoute } = routeBuilder.getInstance({
  additionalBaseUrls: {
    API: "https://api.example.com",
  },
  defaultBaseUrl: "/",
  formattedValidationErrors: true,
});
```

Root config has returned us with a createRouter utility function, this function is what we use to define our individual route configs.

```tsx
// Importing from `global.route.ts`
export const WorkspaceRoute = createRoute({
  fn: ({ workspaceId }) => `/workspace/${workspaceId}`,
  name: "WorkspaceRoute",
  paramsSchema: object({
    workspaceId: string(),
  }),
  baseUrl: "API",
  searchParamsSchema: object({
    withOwner: boolean(),
  }),
});

console.log(
  WorkspaceRoute({ workspaceId: "123" }, { search: { withOwner: true } })
);

// result: https://api.example.com/workspace/123?withOwner=true
```

```tsx
// Path: src/index.ts
// import { WorkspaceRoute } from "./routes.ts";

<Link href={WorkspaceRoute({ workspaceId: "123" })}>
  <Button>Workspace</Button>
</Link>
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
    baseUrl: "https://jsonplaceholder.typicode.com", // will throw an error if custom baseRoute is not valid url
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
