import {
  JsonInput,
  Button,
  Paper,
  Stack,
  Text,
  Code,
  Group,
  Box,
} from "@mantine/core";
import { IconUpload, IconBracketsAngle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useBulkUpload } from "../hooks/useBulkUpload";
const EXAMPLE_JSON = `{
  "questions": [
    {
      "textUzl": "Yo'l belgisi nimani bildiradi?",
      "textUzc": "Йўл белгиси нимани билдиради?",
      "textEn": "What does the road sign indicate?",
      "textRu": "Что означает дорожный знак?",
      "explanationUzl": "Bu belgi transport vositalarini to'xtatishni taqiqlaydi.",
      "explanationUzc": "Бу белги транспорт воситаларини тўхтатишни тақиқлайди.",
      "explanationEn": "This sign prohibits stopping vehicles.",
      "explanationRu": "Этот знак запрещает остановку транспортных средств.",
      "topicId": 1,
      "difficulty": "MEDIUM",
      "options": [
        {
          "optionIndex": 0,
          "textUzl": "To'xtash taqiqlanadi",
          "textUzc": "Тўхташ тақиқланади",
          "textEn": "Stopping is prohibited",
          "textRu": "Остановка запрещена"
        },
        {
          "optionIndex": 1,
          "textUzl": "To'xtab turish",
          "textUzc": "Тўхтаб туриш",
          "textEn": "Parking",
          "textRu": "Стоянка"
        }
      ],
      "correctAnswerIndex": 0,
      "imageUrl": "http://localhost:8080/api/v1/files/questions/abc-123.jpg",
      "isActive": true,
      "correctAnswerIndexValid": true
    }
  ]
}`;

export const JsonBulkUploadQuestion = () => {
  const { t } = useTranslation();
  const { jsonContent, setJsonContent, handleBulkSubmit, loading } =
    useBulkUpload();

  return (
    <Paper withBorder p="xl" radius="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Box>
            <Text size="md" fw={550}>
              {t("questions.jsonBulkTitle")}
            </Text>
            <Text size="sm" c="dimmed">
              {t("questions.jsonBulkDesc")}
            </Text>
          </Box>
          <IconBracketsAngle size={32} color="gray" />
        </Group>

        <JsonInput
          label={t("questions.jsonData")}
          placeholder="[ ... ]"
          validationError={t("questions.jsonSyntaxError")}
          formatOnBlur
          autosize
          minRows={12}
          value={jsonContent}
          onChange={setJsonContent}
        />

        <Paper p="sm" withBorder radius="sm">
          <Text size="xs" fw={700} mb={5}>
            {t("questions.exampleFormat")}
          </Text>
          <Code block>{EXAMPLE_JSON}</Code>
        </Paper>

        <Button
          leftSection={<IconUpload size={18} />}
          loading={loading}
          onClick={handleBulkSubmit}
          disabled={!jsonContent.trim()}
        >
          {t("questions.submitToSystem")}
        </Button>
      </Stack>
    </Paper>
  );
};
