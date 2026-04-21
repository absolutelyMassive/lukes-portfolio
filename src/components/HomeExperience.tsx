"use client";

import {
  AUTO_ADVANCE_ENABLED,
  AUTO_ADVANCE_MS,
  projects,
  WHEEL_STEP_SECTIONS,
} from "@/data/projects";
import { HeroCollage } from "@/components/HeroCollage";
import { ProjectList } from "@/components/ProjectList";
import { ScrollHint } from "@/components/ScrollHint";
import { SiteNav } from "@/components/SiteNav";
import { VignetteMask } from "@/components/VignetteMask";
import { useCallback, useEffect, useRef, useState } from "react";

export function HomeExperience() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const activeRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [timerKey, setTimerKey] = useState(0);
  const [listHover, setListHover] = useState(false);
  const [docHidden, setDocHidden] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const slideAnchorRef = useRef(0);
  const pauseStartRef = useRef<number | null>(null);
  /** Ignore IntersectionObserver while main is programmatically scrolling (avoids list flicker). */
  const ioSuppressedRef = useRef(false);
  const ioSuppressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const releaseIoSuppress = useCallback(() => {
    ioSuppressedRef.current = false;
    if (ioSuppressTimerRef.current) {
      clearTimeout(ioSuppressTimerRef.current);
      ioSuppressTimerRef.current = null;
    }
  }, []);

  const beginProgrammaticScrollSync = useCallback(() => {
    ioSuppressedRef.current = true;
    if (ioSuppressTimerRef.current) {
      clearTimeout(ioSuppressTimerRef.current);
    }
    ioSuppressTimerRef.current = setTimeout(releaseIoSuppress, 1000);
  }, [releaseIoSuppress]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const onVis = () => setDocHidden(document.visibilityState === "hidden");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const root = scrollRef.current;
      const el = sectionRefs.current[index];
      if (!root || !el) return;
      const rootRect = root.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const nextTop = root.scrollTop + (elRect.top - rootRect.top);
      root.scrollTo({
        top: Math.max(0, nextTop),
        behavior: reduceMotion ? "auto" : behavior,
      });
    },
    [reduceMotion],
  );

  const applyIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      beginProgrammaticScrollSync();
      const n = projects.length;
      const next = ((index % n) + n) % n;
      activeRef.current = next;
      setActiveIndex(next);
      scrollToIndex(next, behavior);
    },
    [scrollToIndex, beginProgrammaticScrollSync],
  );

  const pickProject = useCallback(
    (index: number) => {
      applyIndex(index, reduceMotion ? "auto" : "smooth");
      setTimerKey((k) => k + 1);
    },
    [applyIndex, reduceMotion],
  );

  useEffect(() => {
    slideAnchorRef.current = Date.now();
    pauseStartRef.current = null;
  }, [activeIndex, timerKey]);

  useEffect(() => {
    if (!AUTO_ADVANCE_ENABLED || reduceMotion) return;

    let raf = 0;

    const tick = () => {
      const paused = docHidden || listHover;

      if (paused) {
        if (pauseStartRef.current === null) {
          pauseStartRef.current = Date.now();
        }
        raf = requestAnimationFrame(tick);
        return;
      }

      if (pauseStartRef.current !== null) {
        slideAnchorRef.current += Date.now() - pauseStartRef.current;
        pauseStartRef.current = null;
      }

      const elapsed = Date.now() - slideAnchorRef.current;
      if (elapsed >= AUTO_ADVANCE_MS) {
        if (projects.length > 1) {
          applyIndex(activeRef.current + 1, reduceMotion ? "auto" : "smooth");
        } else {
          slideAnchorRef.current = Date.now();
        }
        return;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [
    activeIndex,
    timerKey,
    listHover,
    docHidden,
    reduceMotion,
    applyIndex,
  ]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    let obs: IntersectionObserver | null = null;
    let cancelled = false;

    const tryAttach = () => {
      if (cancelled || obs) return;
      const els = sectionRefs.current.filter(
        (e): e is HTMLElement => e !== null,
      );
      if (els.length !== projects.length) {
        requestAnimationFrame(tryAttach);
        return;
      }
      obs = new IntersectionObserver(
        (entries) => {
          if (ioSuppressedRef.current) return;
          const sorted = [...entries]
            .filter((e) => e.isIntersecting && e.target instanceof HTMLElement)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          const top = sorted[0];
          if (!top?.target) return;
          const idx = sectionRefs.current.findIndex((el) => el === top.target);
          if (idx >= 0) {
            activeRef.current = idx;
            setActiveIndex(idx);
          }
        },
        { root, rootMargin: "0px", threshold: [0.35, 0.55, 0.75] },
      );
      els.forEach((el) => obs?.observe(el));
    };

    requestAnimationFrame(tryAttach);

    return () => {
      cancelled = true;
      obs?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!WHEEL_STEP_SECTIONS || reduceMotion) return;
    const root = scrollRef.current;
    if (!root) return;
    let acc = 0;
    const onWheel = (e: WheelEvent) => {
      acc += e.deltaY;
      const threshold = 60;
      if (Math.abs(acc) < threshold) return;
      e.preventDefault();
      const dir = acc > 0 ? 1 : -1;
      acc = 0;
      pickProject(activeRef.current + dir);
    };
    root.addEventListener("wheel", onWheel, { passive: false });
    return () => root.removeEventListener("wheel", onWheel);
  }, [pickProject, reduceMotion]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScrollEnd = () => releaseIoSuppress();
    el.addEventListener("scrollend", onScrollEnd);
    return () => {
      el.removeEventListener("scrollend", onScrollEnd);
    };
  }, [releaseIoSuppress]);

  const setSectionRef = useCallback((index: number, el: HTMLElement | null) => {
    sectionRefs.current[index] = el;
  }, []);

  return (
    <div className="relative min-h-dvh bg-[#020202] text-white">
      <SiteNav />

      <main
        ref={scrollRef}
        className="fixed inset-x-0 bottom-0 top-0 snap-y snap-mandatory overflow-y-auto overscroll-y-contain scroll-pt-[76px]"
        aria-label="Projects"
      >
        <div className="w-full pb-[min(42vh,360px)] min-[1100px]:pb-0">
          {projects.map((project, index) => (
            <section
              key={project.id}
              id={`project-${project.id}`}
              ref={(el) => setSectionRef(index, el)}
              className="relative h-[100dvh] min-h-[100dvh] w-full snap-start snap-always overflow-hidden"
              aria-label={project.title}
            >
              <VignetteMask />
              <HeroCollage variant={index} collage={project.collage} />
            </section>
          ))}
        </div>
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 top-[76px] z-20 flex justify-center px-6 min-[1100px]:px-10">
        <div className="pointer-events-auto flex h-full w-full max-w-[1440px] flex-col items-end justify-end min-[1100px]:justify-start">
          <aside className="flex w-full max-w-[369px] flex-col border-t border-[rgba(255,255,255,0.12)] bg-transparent py-6 max-[1099px]:min-h-[340px] min-[1100px]:min-h-0 min-[1100px]:border-t-0 min-[1100px]:py-0 min-[1100px]:pt-[calc(337px-76px)]">
            <ProjectList
              projects={projects}
              activeIndex={activeIndex}
              onSelect={pickProject}
              onPointerEnter={() => setListHover(true)}
              onPointerLeave={() => setListHover(false)}
            />
          </aside>
        </div>
      </div>

      <ScrollHint />
    </div>
  );
}
