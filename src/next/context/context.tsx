import "server-only";
import * as React from "react";
import { BindServerStoreData, ServerContext } from "./type";
import { AsyncLocalStorage } from "async_hooks";

export const createServerContext = <T,>(defaultValue: T): ServerContext<T> => {
  const store: ServerContext<T>["store"] = new AsyncLocalStorage<
    BindServerStoreData<T>
  >();

  return {
    Provider: ({ children, value }) => {
      return (
        <>
          <SyncContext value={value} storage={store} />
          {children}
        </>
      );
    },
    Consumer: ({ children }) => {
      const storeValue = store.getStore();
      return children(storeValue?.value || defaultValue);
    },
    store: store,
    defaultValue: defaultValue,
  };
};

const SyncContext = ({
  storage,
  value,
}: {
  storage: AsyncLocalStorage<{ value: unknown }>;
  value: unknown;
}) => {
  storage.enterWith({ value });
  return null;
};

export const useServerContext = <T,>(serverCtx: ServerContext<T>) => {
  const store = serverCtx.store.getStore();
  return store?.value || serverCtx.defaultValue;
};
