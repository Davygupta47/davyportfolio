"use client";

import { Column, Row, SmartLink, Icon } from "@once-ui-system/core";
import styles from "./ProjectGrid.module.scss";

interface ProjectData {
  slug: string;
  title: string;
  images: string[];
  link?: string;
}

interface ProjectGridProps {
  projects: ProjectData[];
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  return (
    <Column fillWidth gap="20" className={styles.gridContainer}>
      <div className={styles.grid}>
        {projects.map((project, index) => (
          <div
            key={project.slug}
            className={`${styles.card} ${index % 5 === 0 || index % 5 === 3 ? styles.cardWide : styles.cardNarrow}`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <SmartLink
              href={project.link || `/work/${project.slug}`}
              className={styles.cardLink}
              unstyled
            >
              <div className={styles.cardInner}>
                {/* Parallax image layer */}
                <div className={styles.imageWrapper}>
                  {project.images?.[0] && (
                    <img
                      src={project.images[0]}
                      alt={project.title}
                      className={styles.image}
                      loading={index < 4 ? "eager" : "lazy"}
                    />
                  )}
                  <div className={styles.imageOverlay} />
                </div>

                {/* Content layer */}
                <div className={styles.content}>
                  <div className={styles.topContent} />
                  <div className={styles.bottomContent}>
                    <h3 className={styles.title}>{project.title}</h3>
                    <div className={styles.arrow}>
                      <Icon name="arrowUpRightFromSquare" size="m" />
                    </div>
                  </div>
                </div>
              </div>
            </SmartLink>
          </div>
        ))}
      </div>
    </Column>
  );
}
