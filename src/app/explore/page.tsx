import { Flex, Meta, Schema } from "@once-ui-system/core";
import ExploreView from "@/components/explore/ExploreView";
import { baseURL, explore, person } from "@/resources";

export async function generateMetadata() {
  return Meta.generate({
    title: explore.title,
    description: explore.description,
    baseURL: baseURL,
    image: `/api/og/generate?title=${encodeURIComponent(explore.title)}`,
    path: explore.path,
  });
}

export default function Explore() {
  return (
    <Flex fillWidth direction="column" minHeight="0">
      <Schema
        as="webPage"
        baseURL={baseURL}
        title={explore.title}
        description={explore.description}
        path={explore.path}
        image={`/api/og/generate?title=${encodeURIComponent(explore.title)}`}
        author={{
          name: person.name,
          url: `${baseURL}${explore.path}`,
          image: `${baseURL}${person.avatar}`,
        }}
      />
      <ExploreView />
    </Flex>
  );
}
