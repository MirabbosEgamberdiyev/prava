import { Container } from "@mantine/core";
import { TopicList } from "../../features/Topic/components/TopicList";
import SEO from "../../components/common/SEO";

const Topics_Page = () => {
  return (
    <Container size="xl" py="md">
      <SEO
        title="Mavzular - YHQ mavzulari bo'yicha testlar"
        description="Yo'l harakati qoidalari mavzulari bo'yicha testlarni yeching. Har bir mavzu bo'yicha alohida tayyorlaning."
        canonical="/topics"
        noIndex={true}
      />
      <TopicList />
    </Container>
  );
};

export default Topics_Page;
