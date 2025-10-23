import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

type ApiRequestOptions = {
  params?: Record<string, string | number | boolean | null | undefined>;
  headers?: HeadersInit;
};

function serializeQuery(params: ApiRequestOptions["params"]): string {
  if (!params) return "";

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    searchParams.append(key, String(value));
  }

  return searchParams.toString();
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options: ApiRequestOptions = {},
): Promise<Response> {
  const { params, headers } = options;
  const queryString = serializeQuery(params);
  const separator = queryString ? (url.includes("?") ? "&" : "?") : "";
  const targetUrl = `${url}${separator}${queryString}`;

  const mergedHeaders: HeadersInit = {
    ...(headers ?? {}),
    ...(data ? { "Content-Type": "application/json" } : {}),
  };

  const res = await fetch(targetUrl, {
    method,
    headers: mergedHeaders,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
