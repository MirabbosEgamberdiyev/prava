import { TopicList } from "../../features/Topic/components/TopicList";
import SEO from "../../components/common/SEO";

const Topics_Page = () => {
  return (
    <>
      <SEO
        title="Mavzular - YHQ mavzulari bo'yicha testlar"
        description="Yo'l harakati qoidalari mavzulari bo'yicha testlarni yeching. Har bir mavzu bo'yicha alohida tayyorlaning."
        canonical="/topics"
        noIndex={true}
      />
      <TopicList />
    </>
  );
};

export default Topics_Page;
