"use client";

/**
 * Expand/collapse timing is shared with {@link ProjectListItem} via
 * `projectListExpandMotion` — edit values in `./projectListExpandMotion.ts`
 * (re-exported here so you can import from this module).
 */

import type { Project } from "@/data/projects";
import { ProjectListItem } from "@/components/ProjectListItem";
import { motion } from "motion/react";
import {
  projectListExpandMotion,
  type ProjectListExpandMotion,
} from "@/components/projectListExpandMotion";

export { projectListExpandMotion, type ProjectListExpandMotion };

type ProjectListProps = {
  projects: Project[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  /** Per-list override; defaults to shared `projectListExpandMotion`. */
  expandMotion?: ProjectListExpandMotion;
};

export function ProjectList({
  projects,
  activeIndex,
  onSelect,
  onPointerEnter,
  onPointerLeave,
  expandMotion = projectListExpandMotion,
}: ProjectListProps) {
  return (
    <motion.nav
      layout
      transition={{ layout: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
      className="flex w-full max-w-[355px] flex-col gap-3"
      aria-label="Projects"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {projects.map((project, index) => (
        <ProjectListItem
          key={project.id}
          rowId={project.id}
          indexLabel={String(index + 1).padStart(2, "0")}
          title={project.title}
          status={project.status}
          description={project.description}
          linkHref={project.caseStudyHref ?? "#"}
          linkLabel="See Case Study"
          expanded={index === activeIndex}
          onToggle={() => onSelect(index)}
          current={index === activeIndex}
          expandMotion={expandMotion}
        />
      ))}
    </motion.nav>
  );
}
