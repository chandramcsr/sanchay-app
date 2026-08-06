"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // useState, not a module-level singleton -- a module-level
  // QueryClient would be shared across requests on the server (Next.js
  // App Router renders route segments server-side even for a
  // client-heavy app like this one), leaking one user's cached query
  // data into another user's request. Constructed once per component
  // instance instead.
  const [queryClient] = useState(() => new QueryClient());
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
