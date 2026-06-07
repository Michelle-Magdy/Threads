import axios, {
  type AxiosRequestConfig,
  type AxiosError,
  type AxiosInstance,
} from "axios";

export function createBrowserApiClient(
  getToken: () => Promise<string | null>,
): AxiosInstance {
  const client = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
    withCredentials: true,
  });

  client.interceptors.request.use(async (config) => {
    const token = await getToken();

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => {
      return response;
    },
    (err: AxiosError) => {
      return Promise.reject(err);
    },
  );
  return client;
}

export async function apiGet<T>(
  client: AxiosInstance,
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await client.get<{ data: T }>(url, config);
  return res.data.data;
}
export async function apiPost<TBody, TResponse>(
  client: AxiosInstance,
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig,
): Promise<TResponse> {
  const res = await client.post<{ data: TResponse }>(url, body, config);
  return res.data.data;
}
export async function apiPatch<TBody, TResponse>(
  client: AxiosInstance,
  body: TBody,
  url: string,
  config?: AxiosRequestConfig,
): Promise<TResponse> {
  const res = await client.patch<{ data: TResponse }>(url, body, config);
  return res.data.data;
}

export async function apiDelete<T>(
  client: AxiosInstance,
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await client.delete<{ data: T }>(url, config);
  return res.data.data;
}

export async function apiPut<T>(
  client: AxiosInstance,
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await client.put<{ data: T }>(url, config);
  return res.data.data;
}
