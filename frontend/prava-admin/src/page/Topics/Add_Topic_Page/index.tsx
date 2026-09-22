import { Stack, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { TopicForm } from "../../../features/topic_add";

const Add_Topic_Page = () => {
  const { t } = useTranslation();
  return (
    <Stack gap="md">
      <Title order={1} fz="h3">
        {t("topics.addNew")}
      </Title>
      <TopicForm />
    </Stack>
  );
};

export default Add_Topic_Page;

