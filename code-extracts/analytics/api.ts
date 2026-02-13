import type { Product, Category, PaginatedResponse } from "@/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003"

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// Products API
export const productsApi = {
  getAll: (params?: {
    page?: number
    limit?: number
    search?: string
    category?: string
    sortBy?: string
    status?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set("page", params.page.toString())
    if (params?.limit) searchParams.set("limit", params.limit.toString())
    if (params?.search) searchParams.set("search", params.search)
    if (params?.category) searchParams.set("category", params.category)
    if (params?.sortBy) searchParams.set("sortBy", params.sortBy)
    if (params?.status) searchParams.set("status", params.status)

    return fetchApi<PaginatedResponse<Product>>(
      `/api/products?${searchParams.toString()}`
    )
  },

  getBySlug: (slug: string) => {
    return fetchApi<Product>(`/api/products/${slug}`)
  },

  getFeatured: (limit = 8) => {
    return fetchApi<PaginatedResponse<Product>>(
      `/api/products?status=PUBLISHED&limit=${limit}&sortBy=popularity`
    )
  },

  getNewArrivals: (limit = 8) => {
    return fetchApi<PaginatedResponse<Product>>(
      `/api/products?status=PUBLISHED&limit=${limit}&sortBy=createdAt&sortOrder=desc`
    )
  },
}

// Categories API
export const categoriesApi = {
  getAll: () => {
    return fetchApi<Category[]>("/api/categories")
  },

  getBySlug: (slug: string) => {
    return fetchApi<Category>(`/api/categories/${slug}`)
  },
}

// Analytics API
export const analyticsApi = {
  trackEvent: (event: {
    eventType: string
    productId?: string
    metadata?: Record<string, unknown>
  }) => {
    return fetchApi<void>("/api/analytics/events", {
      method: "POST",
      body: JSON.stringify(event),
    })
  },
}
