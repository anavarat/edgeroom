// edgeroom/apps/web/src/api/client.ts
export type ApiError = {
  code?: string;
  message: string;
  details?: unknown;
};

export class HttpError extends Error {
  status: number;
  body?: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function parseJsonSafely(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function requestJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, {
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const body = await parseJsonSafely(response);
    const message =
      typeof body === "object" && body && "error" in body
        ? String((body as { error?: ApiError }).error?.message ?? "Request failed")
        : `HTTP ${response.status}`;
    throw new HttpError(response.status, message, body);
  }

  return (await response.json()) as T;
}
