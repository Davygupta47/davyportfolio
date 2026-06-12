import { Column, Meta, Schema } from "@once-ui-system/core";
import { baseURL, about, person, work } from "@/resources";
import { getPosts } from "@/utils/utils";
import { ProjectGrid } from "@/components/work/ProjectGrid";

export async function generateMetadata() {
  return Meta.generate({
    title: work.title,
    description: work.description,
    baseURL: baseURL,
    image: `/api/og/generate?title=${encodeURIComponent(work.title)}`,
    path: work.path,
  });
}

export default function Work() {
  const allProjects = getPosts(["src", "app", "work", "projects"])
    .sort((a, b) => new Date(b.metadata.publishedAt).getTime() - new Date(a.metadata.publishedAt).getTime())
    .map((post) => ({
      slug: post.slug,
      title: post.metadata.title,
      summary: post.metadata.summary || "",
      images: post.metadata.images,
      link: post.metadata.link || "",
      tag: (post.metadata.tag as string[]) || [],
      tech: (post.metadata.tech as string[]) || [],
      publishedAt: post.metadata.publishedAt,
    }));

  return (
    <Column maxWidth="l" paddingTop="40" paddingX="l" s={{ paddingX: "16", gap: "24", paddingTop: "24" }} gap="32" style={{ position: "relative", zIndex: 1, margin: "0 auto", width: "100%" }}>
      <Schema
        as="webPage"
        baseURL={baseURL}
        path={work.path}
        title={work.title}
        description={work.description}
        image={`/api/og/generate?title=${encodeURIComponent(work.title)}`}
        author={{
          name: person.name,
          url: `${baseURL}${about.path}`,
          image: `${baseURL}${person.avatar}`,
        }}
      />
      <ProjectGrid projects={allProjects} />
    </Column>
  );
}
