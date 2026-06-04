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
import { home, about, person, baseURL, routes, social } from "@/resources";
import { Mailchimp } from "@/components";
import { Posts } from "@/components/blog/Posts";
import F1CarCanvas from "@/components/3d/F1CarCanvas";

export async function generateMetadata() {
  return Meta.generate({
    title: home.title,
    description: home.description,
    baseURL: baseURL,
    path: home.path,
    image: home.image,
  });
}

export default function Home() {
  return (
    <Column maxWidth="m" gap="xl" paddingY="12" horizontal="center" style={{ position: "relative" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "600px", zIndex: -1, opacity: 0.8 }}>
        <F1CarCanvas />
      </div>
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
            <RevealFx
              fillWidth
              horizontal="center"
              paddingTop="16"
              paddingBottom="32"
              paddingLeft="12"
            >
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
          <RevealFx translateY="4" fillWidth horizontal="center" paddingBottom="16">
            <Heading wrap="balance" variant="display-strong-l">
              {home.headline}
            </Heading>
          </RevealFx>
          <RevealFx translateY="8" delay={0.2} fillWidth horizontal="center" paddingBottom="32">
            <Text wrap="balance" onBackground="neutral-weak" variant="heading-default-xl">
              {home.subline}
            </Text>
          </RevealFx>
          <RevealFx paddingTop="12" delay={0.4} horizontal="center" paddingLeft="12">
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
      {routes["/blog"] && (
        <Column fillWidth gap="24" marginBottom="l">
          <Row fillWidth paddingRight="64">
            <Line maxWidth={48} />
          </Row>
          <Row fillWidth gap="24" marginTop="40" s={{ direction: "column" }}>
            <Row flex={1} paddingLeft="l" paddingTop="24">
              <Heading as="h2" variant="display-strong-xs" wrap="balance">
                Latest from the blog
              </Heading>
            </Row>
            <Row flex={3} paddingX="20">
              <Posts range={[1, 2]} columns="2" />
            </Row>
          </Row>
          <Row fillWidth paddingLeft="64" horizontal="end">
            <Line maxWidth={48} />
          </Row>
        </Column>
      )}
      
      <RevealFx translateY="16" delay={0.6} fillWidth>
        <Column
          fillWidth
          background="neutral-alpha-weak"
          border="neutral-alpha-weak"
          radius="l-4"
          padding="32"
          gap="24"
          horizontal="center"
          style={{
            backdropFilter: "blur(12px)",
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
            border: "1px solid var(--neutral-alpha-medium)",
          }}
        >
          <Column gap="8" horizontal="center" align="center">
            <Heading variant="heading-strong-xl" align="center">
              Let's build something amazing together
            </Heading>
            <Text variant="body-default-m" onBackground="neutral-weak" align="center" style={{ maxWidth: "480px" }}>
              I'm always open to discussing new opportunities, creative collaborations, or machine learning challenges. Reach out and let's connect!
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
            <Button
              href={about.path}
              variant="secondary"
              size="m"
              data-border="rounded"
            >
              More About Me
            </Button>
          </Row>
          
          <Line background="neutral-alpha-weak" />
          
          <Row gap="16" horizontal="center" vertical="center">
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
