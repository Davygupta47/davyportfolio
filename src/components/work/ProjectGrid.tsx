"use client";

import { useState, useMemo } from "react";
import { SmartLink, Icon } from "@once-ui-system/core";
import styles from "./ProjectGrid.module.scss";

interface ProjectData {
  slug: string;
  title: string;
  summary: string;
  images: string[];
  link?: string;
  tag?: string[];
  tech?: string[];
  publishedAt: string;
}

interface ProjectGridProps {
  projects: ProjectData[];
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  const [activeFilter, setActiveFilter] = useState("All");

  // Derive unique tags from all projects
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    projects.forEach((p) => {
      p.tag?.forEach((t) => tagSet.add(t));
    });
    return ["All", ...Array.from(tagSet).sort()];
  }, [projects]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    if (activeFilter === "All") return projects;
    return projects.filter((p) => p.tag?.includes(activeFilter));
  }, [projects, activeFilter]);

  // Extract year from publishedAt
  const getYear = (dateStr: string) => {
    try {
      return new Date(dateStr).getFullYear().toString();
    } catch {
      return "";
    }
  };

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>
          Featured Projects
        </h1>
        <div className={styles.headerLine} />
        <p className={styles.headerSubtitle}>
          Discover my innovative solutions spanning from AI-powered applications to full-stack
          technologies. Each project represents a unique challenge solved with cutting-edge technology.
        </p>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterSection}>
        <div className={styles.filterLabel}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span>Filter Projects</span>
        </div>
        <div className={styles.filterBar}>
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`${styles.filterBtn} ${activeFilter === tag ? styles.filterBtnActive : ""}`}
              onClick={() => setActiveFilter(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Project Cards Grid */}
      <div className={styles.grid}>
        {filteredProjects.map((project, index) => (
          <div
            key={project.slug}
            className={styles.card}
            style={{ animationDelay: `${index * 0.08}s` }}
          >
            {/* Card Image Area */}
            <div className={styles.cardImageArea}>
              <div className={styles.cardImageWrapper}>
                {project.images?.[0] && (
                  <img
                    src={project.images[0]}
                    alt={project.title}
                    className={styles.cardImage}
                    loading={index < 6 ? "eager" : "lazy"}
                  />
                )}
                <div className={styles.cardImageOverlay} />
              </div>

              {/* Badges */}
              <div className={styles.badgeCompleted}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                Completed
              </div>
              <div className={styles.badgeYear}>
                {getYear(project.publishedAt)}
              </div>
            </div>

            {/* Card Body */}
            <div className={styles.cardBody}>
              <h3 className={styles.cardTitle}>{project.title}</h3>
              <p className={styles.cardDescription}>{project.summary}</p>

              {/* Category Tags */}
              {project.tag && project.tag.length > 0 && (
                <div className={styles.cardTags}>
                  {project.tag.map((t) => (
                    <span key={t} className={styles.categoryTag}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Tech Stack */}
              {project.tech && project.tech.length > 0 && (
                <div className={styles.techStack}>
                  {project.tech.slice(0, 3).map((t) => (
                    <span key={t} className={styles.techTag}>{t}</span>
                  ))}
                  {project.tech.length > 3 && (
                    <span className={styles.techTag}>+{project.tech.length - 3}</span>
                  )}
                </div>
              )}

              {/* View Details Button */}
              <SmartLink
                href={project.link || `/work/${project.slug}`}
                className={styles.viewDetailsLink}
                unstyled
              >
                <div className={styles.viewDetailsBtn}>
                  <span className={styles.viewDetailsBtnIcon}>&lt;/&gt;</span>
                  <span>View Details</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </SmartLink>
            </div>

            {/* Racing stripe accent */}
            <div className={styles.racingStripe} />
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filteredProjects.length === 0 && (
        <div className={styles.emptyState}>
          <p>No projects found for &ldquo;{activeFilter}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
