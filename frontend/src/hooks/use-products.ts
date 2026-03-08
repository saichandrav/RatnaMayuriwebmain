import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const useProducts = (params?: Record<string, string>) =>
  useQuery({
    queryKey: ["products", params],
    queryFn: () => api.getProducts(params),
  });

export const useProduct = (id?: string) =>
  useQuery({
    queryKey: ["product", id],
    queryFn: () => api.getProduct(id || ""),
    enabled: Boolean(id),
  });

export const useProductReviews = (id?: string) =>
  useQuery({
    queryKey: ["product-reviews", id],
    queryFn: () => api.getProductReviews(id || ""),
    enabled: Boolean(id),
  });

export const useCanReviewProduct = (id?: string, enabled = true) =>
  useQuery({
    queryKey: ["product-can-review", id],
    queryFn: () => api.canReviewProduct(id || ""),
    enabled: Boolean(id) && enabled,
  });
