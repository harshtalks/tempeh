// AsyncLocalStorage

import React, { ReactNode } from "react";
import type { AsyncLocalStorage } from "async_hooks";

export type ServerContext<T> = {
  Provider: ({
    children,
    value,
  }: {
    children: ReactNode;
    value: T;
  }) => ReactNode;
  Consumer: ({ children }: { children: (value: T) => ReactNode }) => ReactNode;
  defaultValue?: T;
  store: AsyncLocalStorage<BindServerStoreData<T>>;
};

export type BindServerStoreData<T> = { value: T };
