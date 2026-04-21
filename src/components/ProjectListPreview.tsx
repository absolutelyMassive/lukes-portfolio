"use client";

import { ProjectListItem } from "@/components/ProjectListItem";
import { useState } from "react";

export function ProjectListPreview() {
  const [expanded, setExpanded] = useState(true);

  return (
    <ProjectListItem
      indexLabel="04"
      title="Section Name"
      status="Status"
      description="Enhance your stories, reels, posts, with hundreds of engaging templates"
      linkHref="#"
      linkLabel="Learn more"
      expanded={expanded}
      onToggle={() => setExpanded((v) => !v)}
    />
  );
}
