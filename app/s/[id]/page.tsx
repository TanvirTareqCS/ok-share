"use client";

import { use } from "react";
import SharedSecretView from "@/features/shared-secret/SharedSecretView";

export default function SharedSecretPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <SharedSecretView secretId={id} />;
}
