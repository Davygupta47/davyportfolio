import {
  Heading,
  Text,
  Button,
  Avatar,
  RevealFx,
  Column,
  Badge,
  Row,
  Schema,
  Meta,
  Line,
  IconButton,
} from "@once-ui-system/core";
import { home, about, person, baseURL, social } from "@/resources";
import { Mailchimp } from "@/components";
import InlineF1Car from "@/components/3d/InlineF1Car";

export async function generateMetadata() {
  return Meta.generate({
    title: home.title,
    description: home.description,
    baseURL: baseURL,
    path: home.path,
    image: home.image,
  });
}

/* ── Featured project data (top 3) ── */
const featuredProjects = [
  {
    slug: "stocksense",
    title: "StockSense",
    summary:
      "AI trading intelligence using Qwen LLMs with real-time poison detection and adapter-level machine unlearning.",
    image: "/images/projects/myprojects/stocksense.jpg",
    github: "https://github.com/Davygupta47/stocks-project",
    tags: ["ML", "FinTech", "Unlearning"],
  },
  {
    slug: "twinvora",
    title: "Twinvora",
    summary:
      "Adaptive Clinical Intelligence Platform using Patient Digital Twins, causal AI and ambient scribes.",
    image: "/images/projects/myprojects/twinvora.jpg",
    github: "https://github.com/Davygupta47/twinvora",
    tags: ["Healthcare", "Causal AI", "LLaMA-3"],
  },
  {
    slug: "unlearning-plm",
    title: "Unlearning‑PLM",
    summary:
      "Parameter-efficient unlearning framework to selectively erase private data and biases from LLMs.",
    image: "/images/projects/myprojects/Unlearning-plm.jpg",
    github: "https://github.com/Davygupta47/unlearning-plm",
    tags: ["LLM Safety", "Privacy", "PyTorch"],
  },
];

export default function Home() {
  return (
    <Column
      maxWidth="m"
      gap="xl"
      s={{ gap: "l" }}
      paddingY="24"
      horizontal="center"
      style={{ position: "relative", zIndex: 1 }}
    >
      <Schema
        as="webPage"
        baseURL={baseURL}
        path={home.path}
        title={home.title}
        description={home.description}
        image={`/api/og/generate?title=${encodeURIComponent(home.title)}`}
        author={{
          name: person.name,
          url: `${baseURL}${about.path}`,
          image: `${baseURL}${person.avatar}`,
        }}
      />
      <Column fillWidth horizontal="center" gap="m">
        <Column maxWidth="s" horizontal="center" align="center">
          {home.featured.display && (
            <RevealFx fillWidth horizontal="center" paddingTop="12" paddingBottom="24">
              <Badge
                background="brand-alpha-weak"
                paddingX="12"
                paddingY="4"
                onBackground="neutral-strong"
                textVariant="label-default-s"
                arrow={false}
                href={home.featured.href}
              >
                <Row paddingY="2">{home.featured.title}</Row>
              </Badge>
            </RevealFx>
          )}
          <RevealFx translateY="4" fillWidth horizontal="center" paddingBottom="12">
            <Heading wrap="balance" variant="display-strong-l">
              {home.headline}
            </Heading>
          </RevealFx>
          <RevealFx translateY="8" delay={0.2} fillWidth horizontal="center" paddingBottom="24">
            <Text wrap="balance" onBackground="neutral-weak" variant="heading-default-xl">
              {home.subline}
            </Text>
          </RevealFx>
          <RevealFx paddingTop="8" delay={0.4} horizontal="center">
            <Button
              id="about"
              data-border="rounded"
              href={about.path}
              variant="secondary"
              size="m"
              weight="default"
              arrowIcon
            >
              <Row gap="8" vertical="center" paddingRight="4">
                {about.avatar.display && (
                  <Avatar
                    marginRight="8"
                    style={{ marginLeft: "-0.75rem" }}
                    src={person.avatar}
                    size="m"
                  />
                )}
                {about.title}
              </Row>
            </Button>
          </RevealFx>
        </Column>
      </Column>

      <RevealFx translateY="12" delay={0.5} fillWidth horizontal="center">
        <InlineF1Car />
      </RevealFx>

      {/* Gradient accent line separator */}
      <div className="gradient-accent-line" />

      {/* ═══════ RESUME SECTION ═══════ */}
      <RevealFx translateY="16" delay={0.55} fillWidth>
        <div className="resume-section">
          <div className="resume-section__inner">
            <div className="resume-section__text">
              <Heading variant="heading-strong-l">
                Résumé
              </Heading>
              <Text variant="body-default-m" onBackground="neutral-weak" style={{ maxWidth: "480px", lineHeight: 1.7 }}>
                Download my full résumé for a detailed look at my experience in
                machine learning engineering, research publications, and leadership.
              </Text>
            </div>

            <div className="resume-section__actions">
              <Button
                id="resume-download"
                href="/resume/Dwaipayan_Dasgupta_Resume.pdf"
                variant="primary"
                size="m"
                data-border="rounded"
                prefixIcon="download"
              >
                Download Résumé
              </Button>
              <Button
                id="resume-about"
                href={about.path}
                variant="secondary"
                size="m"
                data-border="rounded"
                arrowIcon
              >
                View Full Profile
              </Button>
            </div>
          </div>
        </div>
      </RevealFx>

      {/* ═══════ FEATURED PROJECTS SECTION ═══════ */}
      <RevealFx translateY="16" delay={0.6} fillWidth>
        <Column fillWidth gap="24">
          <Column gap="8" horizontal="center" align="center">
            <Heading variant="heading-strong-l" align="center">
              Featured Projects
            </Heading>
            <Text variant="body-default-m" onBackground="neutral-weak" align="center" style={{ maxWidth: "520px", lineHeight: 1.7 }}>
              A curated selection of my most impactful work in AI/ML — from
              production trading systems to clinical intelligence platforms.
            </Text>
          </Column>

          <div className="featured-projects-grid">
            {featuredProjects.map((project) => (
              <a
                key={project.slug}
                href={`/work/${project.slug}`}
                className="featured-project-card"
              >
                <div className="featured-project-card__img-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={project.image}
                    alt={project.title}
                    className="featured-project-card__img"
                  />
                  <div className="featured-project-card__overlay" />
                </div>

                <div className="featured-project-card__body">
                  <div className="featured-project-card__tags">
                    {project.tags.map((t) => (
                      <span key={t} className="featured-project-card__tag">{t}</span>
                    ))}
                  </div>
                  <h3 className="featured-project-card__title">{project.title}</h3>
                  <p className="featured-project-card__summary">{project.summary}</p>
                  <div className="featured-project-card__footer">
                    <span className="featured-project-card__link">
                      View Project →
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>

          <Row horizontal="center" paddingTop="8">
            <Button
              id="view-all-projects"
              href="/work"
              variant="secondary"
              size="m"
              data-border="rounded"
              arrowIcon
            >
              View All Projects
            </Button>
          </Row>
        </Column>
      </RevealFx>

      {/* Gradient accent line separator */}
      <div className="gradient-accent-line" />

      {/* ═══════ CONTACT / CTA SECTION ═══════ */}
      <RevealFx translateY="16" delay={0.7} fillWidth>
        <Column
          fillWidth
          radius="l-4"
          padding="40"
          s={{ padding: "24" }}
          gap="24"
          horizontal="center"
          className="cta-card"
        >
          <Column gap="12" horizontal="center" align="center">
            <Heading variant="heading-strong-xl" align="center">
              Let&apos;s build something amazing together
            </Heading>
            <Text
              variant="body-default-m"
              onBackground="neutral-weak"
              align="center"
              style={{ maxWidth: "480px", lineHeight: 1.7 }}
            >
              I&apos;m always open to discussing new opportunities, creative collaborations, or
              machine learning challenges. Reach out and let&apos;s connect!
            </Text>
          </Column>

          <Row gap="16" vertical="center" horizontal="center" wrap style={{ width: "100%" }}>
            <Button
              href={`mailto:${person.email}`}
              variant="primary"
              size="m"
              data-border="rounded"
              prefixIcon="email"
            >
              Email Me
            </Button>
            <Button href={about.path} variant="secondary" size="m" data-border="rounded">
              More About Me
            </Button>
          </Row>

          <Line background="neutral-alpha-weak" />

          <Row gap="12" horizontal="center" vertical="center">
            {social.map(
              (item) =>
                item.link && (
                  <IconButton
                    key={item.name}
                    href={item.link}
                    icon={item.icon}
                    tooltip={item.name}
                    size="m"
                    variant="ghost"
                  />
                ),
            )}
          </Row>
        </Column>
      </RevealFx>

      <Mailchimp />
    </Column>
  );
}
