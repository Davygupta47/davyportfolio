import { Column, Heading, Text, Meta, Schema } from "@once-ui-system/core";
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
    <>
      {/* F1 Racing Background Elements */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {/* Racing grid lines */}
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.03 }}>
          <defs>
            <pattern id="f1grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#ffffff" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#f1grid)" />
        </svg>

        {/* Diagonal racing stripes */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-10%',
          width: '2px',
          height: '200%',
          background: 'linear-gradient(180deg, transparent, rgba(225, 6, 0, 0.1), transparent)',
          transform: 'rotate(25deg)',
        }} />
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '5%',
          width: '1px',
          height: '200%',
          background: 'linear-gradient(180deg, transparent, rgba(168, 85, 247, 0.08), transparent)',
          transform: 'rotate(25deg)',
        }} />
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-5%',
          width: '2px',
          height: '200%',
          background: 'linear-gradient(180deg, transparent, rgba(225, 6, 0, 0.06), transparent)',
          transform: 'rotate(25deg)',
        }} />

        {/* Ambient red glow - top right */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(225, 6, 0, 0.06) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }} />

        {/* Ambient purple glow - bottom left */}
        <div style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.05) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }} />
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
        <ProjectGrid projects={allProjects} />
      </Column>
    </>
  );
}
