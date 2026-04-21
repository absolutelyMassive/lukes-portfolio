"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId } from "react";
import {
  projectListExpandMotion,
  type ProjectListExpandMotion,
} from "@/components/projectListExpandMotion";

export type ProjectListItemProps = {
  /** Stable id for Motion keys (e.g. project id). */
  rowId?: string;
  indexLabel: string;
  title: string;
  status: string;
  description: string;
  linkHref: string;
  linkLabel?: string;
  expanded: boolean;
  onToggle: () => void;
  current?: boolean;
  className?: string;
  /** Override defaults from `projectListExpandMotion.ts` (e.g. from `ProjectList`). */
  expandMotion?: ProjectListExpandMotion;
};

export function ProjectListItem({
  rowId,
  indexLabel,
  title,
  status,
  description,
  linkHref,
  linkLabel = "Learn more",
  expanded,
  onToggle,
  current = false,
  className = "",
  expandMotion = projectListExpandMotion,
}: ProjectListItemProps) {
  const labelId = useId();
  const panelId = `${labelId}-panel`;
  const panelMotionKey = `panel-${rowId ?? indexLabel}`;
  const reduce = useReducedMotion();

  const panelTransition = reduce ? { duration: 0 } : expandMotion.panel;
  const contentTransition = reduce ? { duration: 0 } : expandMotion.content;

  return (
    <div
      className={["max-w-[355px] text-black", className].filter(Boolean).join(" ")}
    >
      <div className="rounded bg-white px-3 py-4">
        <button
          type="button"
          id={labelId}
          aria-expanded={expanded}
          aria-controls={expanded ? panelId : undefined}
          aria-current={current ? "true" : undefined}
          className="flex w-full min-w-0 items-start gap-4 bg-transparent text-left text-inherit outline-offset-4 focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
          onClick={onToggle}
        >
          <span className="flex size-5 shrink-0 items-center justify-center font-sans text-sm font-medium leading-5 tabular-nums">
            {indexLabel}
          </span>
          <span className="flex min-w-0 flex-1 items-start justify-between gap-2.5 font-sans text-sm font-medium leading-5">
            <span className="min-w-0 flex-1">{title}</span>
            <span className="shrink-0 text-right text-black/75">{status}</span>
          </span>
        </button>

        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.div
              key={panelMotionKey}
              id={panelId}
              role="region"
              aria-labelledby={labelId}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={panelTransition}
              style={{ overflow: "hidden" }}
            >
              <motion.div
                className="flex flex-col gap-2 pl-9 pt-2"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={contentTransition}
              >
                <p className="font-sans text-sm font-normal leading-5">{description}</p>
                <Link
                  href={linkHref}
                  className="inline-flex max-w-max items-center gap-2.5 self-start font-sans text-sm font-medium leading-5 text-black underline decoration-black/25 underline-offset-[6px] outline-offset-4 hover:decoration-black focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
                >
                  {linkLabel}
                  <span className="select-none" aria-hidden>
                    ↗
                  </span>
                </Link>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
