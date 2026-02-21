import { useState } from "react";
import { Group, Title, TextInput, Select } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useDebouncedValue } from "@mantine/hooks";
import { QuestionList } from "../../features/question";
import { useTopicOptions } from "../../features/topic/hooks/useTopics";

const Question_Page = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [topicId, setTopicId] = useState<number | null>(null);
  const [debouncedSearch] = useDebouncedValue(search, 400);
  const { options: topicOptions } = useTopicOptions();

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Title order={2}>{t("questions.title")}</Title>
        <Group>
          <TextInput
            placeholder={t("questions.searchPlaceholder")}
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
          <Select
            placeholder={t("questions.topicFilter")}
            data={topicOptions}
            value={topicId?.toString() ?? null}
            onChange={(val) => setTopicId(val ? parseInt(val) : null)}
            clearable
            searchable
            w={200}
          />
        </Group>
      </Group>
      <QuestionList
        searchQuery={debouncedSearch}
        topicId={topicId}
      />
    </div>
  );
};

export default Question_Page;
