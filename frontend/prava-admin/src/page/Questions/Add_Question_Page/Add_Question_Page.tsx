import { Center, Flex, Paper, SegmentedControl, Title } from "@mantine/core";
import {
  JsonBulkUploadQuestion,
  QuestionForm,
} from "../../../features/question_add";
import { useState } from "react";
import { IconCode, IconExternalLink } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

const Add_Question_Page = () => {
  const { t } = useTranslation();
  const [value, setValue] = useState("0");
  return (
    <>
      <Paper p={"sm"} mb={"lg"} withBorder radius={"md"}>
        <Flex wrap={"wrap"} justify={"space-between"} align="center">
          <Title order={1} fz="h3" tt={"uppercase"} fw={600}>
            {t("questions.addTitle")}
          </Title>
          <SegmentedControl
            value={value}
            onChange={setValue}
            data={[
              {
                value: "0",
                label: (
                  <Center style={{ gap: 10 }}>
                    <IconExternalLink size={16} />
                    <span>{t("questions.formMode")}</span>
                  </Center>
                ),
              },
              {
                value: "1",
                label: (
                  <Center style={{ gap: 10 }}>
                    <IconCode size={16} />
                    <span>JSON</span>
                  </Center>
                ),
              },
            ]}
          />
        </Flex>
      </Paper>
      {value === "0" ? <QuestionForm /> : <JsonBulkUploadQuestion />}
    </>
  );
};

export default Add_Question_Page;
