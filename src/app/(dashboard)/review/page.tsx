"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Review page redirects to /learn with REVIEW_ONLY session type.
 * We pass the session type via search param.
 */
export default function ReviewPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/learn?type=REVIEW_ONLY");
  }, [router]);

  return null;
}
