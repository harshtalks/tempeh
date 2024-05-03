# safe-fetchttp

It consists of a wrapper fetcher factory function that you can use to create fetcher functions for your need.

let's understand with the example.

Suppose we have a nextjs app where we have a dynamic page for a workspace details that takes workspaceId as a dynamic param with the help of ZOD library.

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

Package also serves the custom fetcher function generator to generate small async fetcher functions. Example:

```ts
export const getPosts = createEndPoint({
  HttpMethod: "GET",
  path: createRoute({
    fn: (params) => `/posts/${params.id}`,
    paramsSchema: object({
      id: string(),
    }),
    name: "getPosts",
    options: {
      internal: false,
      baseUrl: "https://jsonplaceholder.typicode.com",
    },
  }),
  response: object({
    id: string(),
    title: string(),
    body: string(),
  }),
});

const posts = getPosts({
  params: {
    id: `1`,
  },
  init: {
    headers: {
      "Content-Type": "application/json",
    },
  },
});
```
