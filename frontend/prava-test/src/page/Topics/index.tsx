import { Container } from "@mantine/core";
import { TopicList } from "../../features/Topic/components/TopicList";

const Topics_Page = () => {
  return (
    <Container size="xl" py="md">
      <TopicList />
    </Container>
  );
};

export default Topics_Page;
