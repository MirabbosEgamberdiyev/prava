import { Stack, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { TopicListCards } from "../../features/topic";

const Topic_Page = () => {
  const { t } = useTranslation();

  return (
    // Bu sahifada umuman sarlavha yo'q edi — boshqa sahifalardan farqli
    // o'laroq na h1, na vizual kontekst berilmagan edi.
    <Stack gap="md">
      <Title order={1} fz="h3">
        {t("topics.title")}
      </Title>
      <TopicListCards />
    </Stack>
  );
};

export default Topic_Page;
