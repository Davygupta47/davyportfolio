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

export default function Home() {
  return (
    <Column maxWidth="m" gap="xl" paddingY="12" horizontal="center" style={{ position: "relative", zIndex: 1 }}>
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

      <RevealFx translateY="12" delay={0.5} fillWidth horizontal="center">
        <InlineF1Car />
      </RevealFx>

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
