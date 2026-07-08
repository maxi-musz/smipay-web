"use client";

import { useParams } from "next/navigation";
import { ActionEditor } from "../_components/ActionEditor";

export default function ActionEditorPage() {
  const params = useParams<{ id: string }>();
  return <ActionEditor id={params.id} />;
}
