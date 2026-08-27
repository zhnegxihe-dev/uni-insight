"use client";

import { Bookmark } from "lucide-react";
import { ReactionButton } from "@/components/ReactionButton";

export function FavoriteButton({
  endpoint,
  count,
  active,
  label = "收藏",
}: {
  endpoint: string;
  count: number;
  active: boolean;
  label?: string;
}) {
  return (
    <ReactionButton
      endpoint={endpoint}
      count={count}
      active={active}
      label={label}
      icon={Bookmark}
      activeClass="bg-blue-50 text-blue-600"
      activeIconClass="fill-blue-500 text-blue-500"
    />
  );
}