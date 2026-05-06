const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

type RequestOptions = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
};

export async function apiRequest(path: string, options: RequestOptions) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (options.auth) {
    const token = getToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({
    success: false,
    message: "Réponse serveur invalide",
  }));

  return data;
}