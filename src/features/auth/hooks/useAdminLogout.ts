"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { toast } from "sonner";

export const useAdminLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Simulate async delay if needed, or just perform cleanup
      return new Promise<void>((resolve) => {
        // Clear token
        Cookies.remove("accessToken");

        // Clear user data
        localStorage.removeItem("user");

        resolve();
      });
    },
    onSuccess: () => {
      // Clear all react-query cache
      queryClient.clear();

      toast.success("Logged out successfully");
      router.push("/login"); // Middleware would redirect anyway, but explicit is better
    },
    onError: () => {
      toast.error("Failed to log out");
    },
  });
};
