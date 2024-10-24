# Tempeh

- Docs: https://tempeh-docs.vercel.app
- CLI: use [tempeh-cli](https://github.com/harshtalks/tempeh-cli) to fasten up the process

### What's new in >= v5.0.0
- Better APIs
- Better type safety
- Removed fetcher as it was very complicated to use and I couldn't find a way to make the API any better. Please use wretch, kv, or effect/platform to achieve the same.

### Tempeh Routes

Next.js does not provide a way to define routes in a type-safe manner.
```tsx
<Link href={`/workspace/${workspaceId}`}>
  <Button>Workspace</Button>
</Link>
```

To get started with Tempeh, you need to define a global config. This design pattern is chosen for following reasons:

- Tempeh stores all your routes under the hood to keep track of params and search params and for parsing them on demand.
- Tempeh also stores all your additional base urls so that you can always decide which url to forward to in a type-safe manner.

Here we define our root schema:

```tsx
// Path: route.config.ts

// You should only have a single `createRoute` constant across your applications for type safety for your additonal base urls.

const { createRoute, Navigate, useTempehRouter } = routeBuilder({
  additionalBaseUrls: {
    EXAMPLE_COM: "https://example.com",
    DUMMY_API: "https://api.dummy.com",
  },
}).getInstance();
```

- The `additionalBaseUrls` prop is used to define additional base urls that you can use in your route configs.
- Addtional `defaultBaseUrl` prop is used to define the default base url that you want to use in your route configs. Default is `/`.

Root config has returned us with a createRouter utility function, this function is what we use to define our individual route configs.

```tsx
// Importing from `route.config.ts`
import * as z from 'zod'

const WorkspaceRoute = createRoute({
  fn: ({ workspaceId }) => `/workspace/${workspaceId}`,
  name: "WorkspaceRoute",
  paramsSchema: z.object({
    workspaceId: z.string(),
  }),
  searchParamsSchema: z.object({
    withOwner: z.boolean(),
  }),
});


console.log(
  WorkspaceRoute.navigate({ workspaceId: "123" }, { searchParams: { withOwner: true } })
);

// result: /workspace/123?withOwner=true
```

```tsx
// Path: src/index.ts
// import { WorkspaceRoute } from "./routes.ts";

<Link href={WorkspaceRoute.navigate({ workspaceId: "123" })}>
  <Button>Workspace</Button>
</Link>
```

Or you can use our declarative routing approach as following:

```tsx
<WorkspaceRoute.Link params={{ workspaceId: "123" }}>
  <Button>Workspace</Button>
</WorkspaceRoute.Link>
```

Please visit the docs for detailed information: https://tempeh-docs.vercel.app
