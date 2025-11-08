"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard");
  }, []);

  return (
    <>
      <h1 className="flex justify-center items-center w-full h-full text-4xl font-bold text-center">
        Welcome to the Magic Pages Admin Panel
      </h1>
    </>
  );
}
