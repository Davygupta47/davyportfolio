import { Column, Heading, Text, Meta, Schema } from "@once-ui-system/core";
import { baseURL, about, person, work } from "@/resources";
import { getPosts } from "@/utils/utils";
import { ProjectGrid } from "@/components/work/ProjectGrid";
import DotField from "@/components/DotField";

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
      images: post.metadata.images,
      link: post.metadata.link || "",
    }));

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <DotField
          dotRadius={1.5}
          dotSpacing={14}
          bulgeStrength={67}
          glowRadius={160}
          sparkle={false}
          waveAmplitude={0}
          cursorRadius={500}
          cursorForce={0.1}
          bulgeOnly
          gradientFrom="#A855F7"
          gradientTo="#B497CF"
          glowColor="#120F17"
        />
      </div>
      <Column maxWidth="l" paddingTop="40" paddingX="l" gap="32" style={{ position: "relative", zIndex: 1, margin: "0 auto", width: "100%" }}>
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
      <Column gap="12" horizontal="center" marginBottom="8">
        <Heading variant="display-strong-l" align="center">
          {work.title}
        </Heading>
        <Text variant="body-default-m" onBackground="neutral-weak" align="center">
          A collection of AI/ML projects — from research to production.
        </Text>
      </Column>
      <ProjectGrid projects={allProjects} />
    </Column>
    </>
  );
}
