import { useEffect, useState, useRef } from "react";
import { Box, SimpleGrid, Text, Paper } from "@mantine/core";
import {
  IconUsers,
  IconFileText,
  IconClipboardList,
  IconBookmarks,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import useSWR from "swr";
import classes from "./Home.module.css";

// Counter animatsiya hook
function useCountUp(
  end: number,
  duration: number = 2000,
  start: boolean = true
) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, start]);

  return count;
}

// Format number with commas
function formatNumber(num: number): string {
  return num.toLocaleString("uz-UZ");
}

interface StatItem {
  icon: typeof IconUsers;
  value: number;
  suffix: string;
  labelKey: string;
  color: string;
}

function StatCard({
  stat,
  index,
  isVisible,
  label,
}: {
  stat: StatItem;
  index: number;
  isVisible: boolean;
  label: string;
}) {
  const count = useCountUp(stat.value, 2000, isVisible);

  return (
    <Paper
      className={classes.statCard}
      withBorder
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <Box
        className={classes.statIcon}
        style={{
          backgroundColor: `var(--mantine-color-${stat.color}-1)`,
        }}
      >
        <stat.icon
          size={28}
          color={`var(--mantine-color-${stat.color}-6)`}
          stroke={1.5}
        />
      </Box>
      <Text className={classes.statValue}>
        {formatNumber(count)}
        {stat.suffix}
      </Text>
      <Text className={classes.statLabel}>{label}</Text>
    </Paper>
  );
}

interface PackageCountResponse {
  data: number;
}

interface TopicsResponse {
  data: Array<{ id: number; questionCount: number }>;
}

export function Stats_Section() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Fetch real data from API
  const { data: packageCountData } = useSWR<PackageCountResponse>(
    "/api/v1/packages/count"
  );
  const { data: topicsData } = useSWR<TopicsResponse>(
    "/api/v1/admin/topics/with-questions"
  );

  // Calculate real stats with fallbacks
  const topicsList = topicsData?.data ?? [];
  const totalQuestions = topicsList.reduce(
    (sum, t) => sum + (t.questionCount || 0),
    0
  );
  const totalPackages = packageCountData?.data ?? 0;
  const topicsCount = topicsList.length;

  const stats: StatItem[] = [
    {
      icon: IconUsers,
      value: 1000,
      suffix: "+",
      labelKey: "home.stats.users",
      color: "blue",
    },
    {
      icon: IconFileText,
      value: totalQuestions > 0 ? totalQuestions : 1200,
      suffix: "+",
      labelKey: "home.stats.questions",
      color: "green",
    },
    {
      icon: IconClipboardList,
      value: totalPackages > 0 ? totalPackages : 50,
      suffix: "+",
      labelKey: "home.stats.exams",
      color: "orange",
    },
    {
      icon: IconBookmarks,
      value: topicsCount > 0 ? topicsCount : 10,
      suffix: "",
      labelKey: "home.stats.topics",
      color: "grape",
    },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className={classes.statsSection} ref={sectionRef} aria-label="Statistics">
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="lg">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.labelKey}
            stat={stat}
            index={index}
            isVisible={isVisible}
            label={t(stat.labelKey)}
          />
        ))}
      </SimpleGrid>
    </section>
  );
}
