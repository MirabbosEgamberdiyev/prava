import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Text,
  Tabs,
  SimpleGrid,
  Center,
  Grid,
  Paper,
  Stack,
  Skeleton,
  Button,
} from "@mantine/core";
import {
  IconPackages,
  IconTicket,
  IconRun,
  IconArrowLeft,
  IconBook2,
} from "@tabler/icons-react";
import useSWR from "swr";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../../hooks/useLanguage";
import { BreadcrumbNav } from "../../../components/common/BreadcrumbNav";
import SEO from "../../../components/common/SEO";
import { Package_Card } from "../../../features/Package/components/Package_Card";
import { TicketCard } from "../../../features/Ticket/components/TicketCard";
import styles from "../../../components/dashboard/Dashboard.module.css";
import type { Ticket } from "../../../types";
import type { Package } from "../../../features/Package/types";

interface TopicResponse {
  data: {
    id: number;
    code: string;
    name: { uzl: string; uzc: string; en: string; ru: string };
    description?: { uzl: string; uzc: string; en: string; ru: string };
    questionCount: number;
    isActive: boolean;
  };
}

interface PackagesResponse {
  data: {
    content: Package[];
    totalPages: number;
    totalElements: number;
  };
}

interface TicketsResponse {
  success: boolean;
  data: {
    content: Ticket[];
    totalPages: number;
    totalElements: number;
  };
}

const TopicDetail_Page = () => {
  const { topicCode } = useParams<{ topicCode: string }>();
  const { t, i18n } = useTranslation();
  const { localize } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string | null>("packages");

  // Fetch topic by code
  const { data: topicData, isLoading: topicLoading } = useSWR<TopicResponse>(
    topicCode ? `/api/v1/admin/topics/code/${topicCode}` : null
  );

  const topic = topicData?.data;

  // Fetch packages by topic code
  const { data: packagesData, isLoading: packagesLoading } =
    useSWR<PackagesResponse>(
      topicCode
        ? `/api/v1/packages/topic/${topicCode}?page=0&size=50&sortBy=orderIndex&direction=ASC&lang=${i18n.language}`
        : null
    );

  // Fetch tickets by topic id
  const { data: ticketsData, isLoading: ticketsLoading } =
    useSWR<TicketsResponse>(
      topic?.id
        ? `/api/v2/tickets/topic/${topic.id}?page=0&size=50&sortBy=ticketNumber&direction=ASC&lang=${i18n.language}`
        : null
    );

  const packages = packagesData?.data?.content ?? [];
  const tickets = ticketsData?.data?.content ?? [];

  const handleTicketClick = (ticket: Ticket) => {
    navigate(`/tickets/${ticket.id}`);
  };

  const topicName = topic ? localize(topic.name) : "";

  return (
    <>
      <SEO
        title={`${topicName || t("topics.title")} — ${t("seo.topicDetail.title", "Mavzu Testlari")}`}
        description={`${topicName} — ${t("seo.topicDetail.desc", "Mavzu bo'yicha imtihon savollarini yeching.")}`}
        canonical={`/topics/${topicCode}`}
        noIndex={true}
      />
      {topicLoading ? (
          <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", padding: "20px 0" }}>
            <Skeleton height={20} width={200} mb="md" />
            <Skeleton height={32} width={300} mb="xs" />
            <Skeleton height={16} width={400} mb="lg" />
            <Skeleton height={40} width="100%" />
          </div>
        ) : !topic ? (
          <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", padding: "60px 0", textAlign: "center" }}>
            <Text c="dimmed" size="lg">{t("topics.notFound")}</Text>
            <Button
              mt="md"
              variant="light"
              onClick={() => navigate("/topics")}
              leftSection={<IconArrowLeft size={16} />}
            >
              {t("topics.title", "Barcha mavzular")}
            </Button>
          </div>
        ) : (
          <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
            {/* Page Header */}
            <div className={styles.innerPageHeader}>
              <div className={styles.innerPageHeaderLeft}>
                <div style={{ marginBottom: 8 }}>
                  <BreadcrumbNav
                    items={[
                      { label: t("topics.title"), href: "/topics" },
                      { label: topicName },
                    ]}
                  />
                </div>
                <div className={styles.innerPageTitleRow}>
                  <h2 className={styles.innerPageTitle}>
                    <IconBook2
                      size={24}
                      stroke={2}
                      style={{ color: "var(--primary)", verticalAlign: "middle", marginRight: 8 }}
                    />
                    {topicName}
                  </h2>
                  {topic.questionCount > 0 && (
                    <span className={styles.innerPageCountChip}>
                      {topic.questionCount} {t("common.questions", "savol")}
                    </span>
                  )}
                </div>
                {topic.description && (
                  <p className={styles.innerPageSubtitle}>
                    {localize(topic.description)}
                  </p>
                )}
              </div>
              <div className={styles.innerPageActions}>
                <button
                  type="button"
                  onClick={() => navigate("/topics")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 16px",
                    borderRadius: 10,
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text)",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  <IconArrowLeft size={16} />
                  {t("common.back", "Orqaga")}
                </button>
              </div>
            </div>

            {/* Content Tabs */}
            <Tabs value={activeTab} onChange={setActiveTab} style={{ marginTop: 20 }}>
              <div
                style={{
                  overflowX: "auto",
                  WebkitOverflowScrolling: "touch",
                  scrollbarWidth: "none",
                  marginBottom: 16,
                }}
              >
                <Tabs.List style={{ flexWrap: "nowrap", minWidth: "max-content" }}>
                  <Tabs.Tab value="packages" leftSection={<IconPackages size={16} />}>
                    {t("topics.packages")} ({packages.length})
                  </Tabs.Tab>
                  <Tabs.Tab value="tickets" leftSection={<IconTicket size={16} />}>
                    {t("topics.tickets")} ({tickets.length})
                  </Tabs.Tab>
                  <Tabs.Tab value="marathon" leftSection={<IconRun size={16} />}>
                    {t("marathon.title")}
                  </Tabs.Tab>
                </Tabs.List>
              </div>

              <Tabs.Panel value="packages">
                {packagesLoading ? (
                  <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Paper key={i} withBorder p="md" radius="md">
                        <Stack gap="sm">
                          <Skeleton height={24} width="60%" radius="sm" />
                          <Skeleton height={16} width="40%" radius="sm" />
                          <Skeleton height={36} radius="sm" />
                        </Stack>
                      </Paper>
                    ))}
                  </SimpleGrid>
                ) : packages.length === 0 ? (
                  <Center h={200}>
                    <Text c="dimmed">{t("package.notFound")}</Text>
                  </Center>
                ) : (
                  <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
                    {packages.map((pkg) => (
                      <Package_Card key={pkg.id} pkg={pkg} />
                    ))}
                  </SimpleGrid>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="tickets">
                {ticketsLoading ? (
                  <Grid gutter="md">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Grid.Col key={i} span={{ base: 6, md: 4, lg: 4, xl: 3 }}>
                        <Paper withBorder p="md" radius="md">
                          <Stack gap="sm" align="center">
                            <Skeleton height={40} width={40} circle />
                            <Skeleton height={16} width="60%" radius="sm" />
                            <Skeleton height={12} width="40%" radius="sm" />
                          </Stack>
                        </Paper>
                      </Grid.Col>
                    ))}
                  </Grid>
                ) : tickets.length === 0 ? (
                  <Center h={200}>
                    <Text c="dimmed">{t("ticket.notFound")}</Text>
                  </Center>
                ) : (
                  <Grid gutter="md">
                    {tickets.map((ticket) => (
                      <Grid.Col
                        key={ticket.id}
                        span={{ base: 6, md: 4, lg: 4, xl: 3 }}
                      >
                        <TicketCard ticket={ticket} onClick={handleTicketClick} />
                      </Grid.Col>
                    ))}
                  </Grid>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="marathon">
                <Center h={200}>
                  <Stack align="center" gap="md">
                    <Text c="dimmed">{t("marathon.setupDesc")}</Text>
                    <Button
                      radius="md"
                      onClick={() =>
                        navigate("/marafon", { state: { topicId: topic.id } })
                      }
                    >
                      {t("topics.startMarathon")}
                    </Button>
                  </Stack>
                </Center>
              </Tabs.Panel>
            </Tabs>
          </div>
        )}
    </>
  );
};

export default TopicDetail_Page;
