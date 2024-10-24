import { describe, expect, test } from "vitest";
import { routeBuilder } from "../routes";
import * as z from "zod";
// Test context
const getRouterInstance = () => {
  const { createRoute, Navigate, useTempehRouter } = routeBuilder({
    additionalBaseUrls: {
      EXAMPLE_COM: "https://example.com",
      DUMMY_API: "https://api.dummy.com",
    },
  }).getInstance();

  const HomeRoute = createRoute({
    name: "home",
    fn: () => "/",
    paramsSchema: z.object({}).strict(),
  });

  const WebSocketRoute = createRoute({
    name: "websocket",
    fn: ({ endpoint }) => `ws://${endpoint}`,
    paramsSchema: z
      .object({
        endpoint: z.string(),
        port: z.number().optional(),
      })
      .strict(),
  });

  const ThirdPartyRoute = createRoute({
    name: "thirdParty",
    fn: () => "/user/settings",
    paramsSchema: z.object({}).strict(),
    baseUrl: "EXAMPLE_COM",
  });

  const WorkspaceRoute = createRoute({
    name: "workspace",
    fn: ({ workspaceId }) => `/workspace/${workspaceId}`,
    paramsSchema: z
      .object({
        workspaceId: z.string(),
      })
      .strict(),
    searchParamsSchema: z
      .object({
        tab: z.string().optional(),
        view: z.string().optional(),
        archived: z
          .boolean()
          .transform((el) => (el ? 1 : 0))
          .optional(),
      })
      .strict(),
  });

  return {
    createRoute,
    Navigate,
    useTempehRouter,
    HomeRoute,
    WebSocketRoute,
    ThirdPartyRoute,
    WorkspaceRoute,
  };
};

// we will simulate the testing for navigate function
describe("navigate", () => {
  const { HomeRoute, WebSocketRoute, ThirdPartyRoute, WorkspaceRoute } =
    getRouterInstance();

  describe("Non Base Urls", () => {
    test("/ is a valid path and base", () => {
      expect(HomeRoute.navigate({})).toEqual("/");
    });

    test("Non navigation specific urls should throw error", () => {
      expect(() =>
        WebSocketRoute.navigate({
          endpoint: "localhost",
        })
      ).toThrowError();
    });
  });

  describe("Base Urls", () => {
    test("when given, should use the route default base", () => {
      expect(ThirdPartyRoute.navigate({})).toEqual(
        "https://example.com/user/settings"
      );
    });

    test("when overriden, should use the new base from one of the additional base urls", () => {
      expect(
        ThirdPartyRoute.navigate(
          {},
          {
            baseUrl: "DUMMY_API",
          }
        )
      ).toEqual("https://api.dummy.com/user/settings");
    });

    test("when overriden, should throw the error if base url is not one from the config and also is an invalid url", () => {
      expect(() =>
        ThirdPartyRoute.navigate(
          {},
          {
            baseUrl: "//",
          }
        )
      ).toThrow();
    });

    test("when overriden, should use the new url as base if base url is not one from the config and also is an valid url", () => {
      expect(
        ThirdPartyRoute.navigate(
          {},
          {
            baseUrl: "https://github.com",
          }
        )
      ).toEqual("https://github.com/user/settings");
    });
  });

  describe("schema validation", () => {
    test("invalid params should throw error", () => {
      expect(() =>
        WorkspaceRoute.navigate({
          // @ts-ignore
          workspaceId: 124,
        })
      ).toThrowError();
    });

    test("valid params should yield valid url", () => {
      expect(
        WorkspaceRoute.navigate({
          workspaceId: "123",
        })
      ).toEqual("/workspace/123");
    });

    test("valid searchparams should be appended in url", () => {
      expect(
        WorkspaceRoute.navigate(
          {
            workspaceId: "123",
          },
          {
            searchParams: {
              archived: true,
              tab: "overview",
              view: "list",
            },
          }
        )
      ).toEqual("/workspace/123?archived=1&tab=overview&view=list");
    });
  });
});
