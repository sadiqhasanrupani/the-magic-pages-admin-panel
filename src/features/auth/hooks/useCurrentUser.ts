"use client";

import { useEffect, useState } from "react";

interface User {
  name: string;
  email: string;
  avatar: string;
}

export function useCurrentUser() {
  const [user, setUser] = useState<User>({
    name: "Admin User",
    email: "",
    avatar: "https://github.com/shadcn.png",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        // Derive name from email if not present
        const derivedName = parsed.email.split("@")[0];

        setUser({
          name: parsed.name || derivedName, // simplistic name derivation
          email: parsed.email,
          avatar: "https://github.com/shadcn.png", // default avatar
        });
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
  }, []);

  return { user };
}
