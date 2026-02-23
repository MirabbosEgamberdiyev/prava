import {
    Modal,
    Stack,
    Group,
    Badge,
    Image,
    Box,
    Text,
    Paper,
    Divider,
    Loader,
    Center,
} from "@mantine/core";
import { IconChartBar, IconCircleCheckFilled } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useQuestion } from "../hooks/useQuestion";
import { getImageUrl } from "../../../utils/imageUtils";

const difficultyColors: Record<string, string> = {
    EASY: "green",
    MEDIUM: "yellow",
    HARD: "red",
};

interface QuestionViewModalProps {
    opened: boolean;
    onClose: () => void;
    questionId: number | null;
}

export const QuestionViewModal = ({
                                      opened,
                                      onClose,
                                      questionId,
                                  }: QuestionViewModalProps) => {
    const { t } = useTranslation();
    const { question: viewQuestion, isLoading } = useQuestion(opened ? questionId : null);

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={t("questions.viewTitle")}
            size="lg"
        >
            {isLoading && (
                <Center h={200}>
                    <Loader size="sm" />
                </Center>
            )}

            {!isLoading && viewQuestion && (
                <Stack gap="md">
                    {/* Badges */}
                    <Group gap="xs">
                        <Badge variant="filled" color="blue">
                            ID: {viewQuestion.id}
                        </Badge>
                        {viewQuestion.topic && (
                            <Badge variant="light" color="cyan">
                                {viewQuestion.topic.name}
                            </Badge>
                        )}
                        {viewQuestion.difficulty && (
                            <Badge variant="dot" color={difficultyColors[viewQuestion.difficulty]}>
                                {viewQuestion.difficulty}
                            </Badge>
                        )}
                    </Group>

                    {/* ✅ Rasm — getImageUrl orqali to'g'ri URL */}
                    {viewQuestion.imageUrl && (
                        <Image
                            src={getImageUrl(viewQuestion.imageUrl)}
                            radius="md"
                            fit="contain"
                            h={250}
                            fallbackSrc="https://placehold.co/600x300?text=Image+not+found"
                        />
                    )}

                    {/* Savol matni */}
                    <Box>
                        <Text size="sm" c="dimmed" fw={500} mb={4}>
                            {t("questions.questionLabel")}
                        </Text>
                        <Text fw={600} size="lg">
                            {viewQuestion.text}
                        </Text>
                    </Box>

                    {/* Tushuntirish */}
                    <Box>
                        <Text size="sm" c="dimmed" fw={500} mb={4}>
                            {t("questions.explanationLabel")}
                        </Text>
                        <Paper p="sm" bg="gray.0" radius="md">
                            <Text size="sm">{viewQuestion.explanation}</Text>
                        </Paper>
                    </Box>

                    {/* Muvaffaqiyat foizi */}
                    <Group gap="xs">
                        <IconChartBar size={18} />
                        <Text size="sm">
                            {t("questions.successRateLabel")}:{" "}
                            <strong>{viewQuestion.successRate}%</strong>
                        </Text>
                    </Group>

                    <Divider />

                    {/* ✅ Variantlar — to'g'ri interpolation */}
                    <Text size="sm" fw={600} c="dimmed" tt="uppercase">
                        {t("questions.answerOptions")}{" "}
                        ({viewQuestion.options?.length ?? 0})
                    </Text>

                    <Stack gap="xs">
                        {(viewQuestion.options ?? []).map((opt) => (
                            <Paper
                                key={opt.id}
                                p="md"
                                withBorder
                                bg={
                                    viewQuestion.correctAnswerIndex === opt.optionIndex
                                        ? "green.0"
                                        : "gray.0"
                                }
                                style={{
                                    borderColor:
                                        viewQuestion.correctAnswerIndex === opt.optionIndex
                                            ? "var(--mantine-color-green-5)"
                                            : "",
                                    borderWidth:
                                        viewQuestion.correctAnswerIndex === opt.optionIndex ? 2 : 1,
                                }}
                            >
                                <Group gap="sm">
                                    {viewQuestion.correctAnswerIndex === opt.optionIndex ? (
                                        <IconCircleCheckFilled size={22} color="green" />
                                    ) : (
                                        <Badge size="lg" circle color="gray">
                                            {String.fromCharCode(65 + opt.optionIndex)}
                                        </Badge>
                                    )}
                                    <Text size="sm">{opt.text}</Text>
                                </Group>
                            </Paper>
                        ))}
                    </Stack>
                </Stack>
            )}
        </Modal>
    );
};