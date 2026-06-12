import { Column, Heading, Text, Button, Row } from "@once-ui-system/core";

export default function NotFound() {
  return (
    <Column as="section" fill center paddingBottom="160" gap="24">
      <div className="not-found-code">404</div>
      <Heading variant="display-default-xs" align="center">
        Page Not Found
      </Heading>
      <Text
        onBackground="neutral-weak"
        align="center"
        style={{ maxWidth: "400px", lineHeight: 1.6 }}
      >
        The page you&apos;re looking for doesn&apos;t exist or has been moved to another location.
      </Text>
      <Row paddingTop="8">
        <Button href="/" variant="secondary" size="m" data-border="rounded" prefixIcon="home">
          Back to Home
        </Button>
      </Row>
    </Column>
  );
}
