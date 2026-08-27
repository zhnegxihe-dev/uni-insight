"use client";

import { Heart } from "lucide-react";
import { ReactionButton } from "@/components/ReactionButton";

export function LikeButton({
  endpoint,
  count,
  active,
  label = "点赞",
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
      icon={Heart}
      activeClass="bg-rose-50 text-rose-600"
      activeIconClass="fill-rose-500 text-rose-500"
    />
  );
}