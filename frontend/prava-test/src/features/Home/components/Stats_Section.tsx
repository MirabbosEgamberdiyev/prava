import { useEffect, useState, useRef } from "react";
import { SimpleGrid } from "@mantine/core";
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
  value: number;
  suffix: string;
  labelKey: string;
  defaultLabel: string;
}

function StatCard({
  stat,
  isVisible,
  label,
}: {
  stat: StatItem;
  isVisible: boolean;
  label: string;
}) {
  const count = useCountUp(stat.value, 1800, isVisible);

  return (
    <div className={classes.statCardMinimal}>
      <div className={classes.statValueMinimal}>
        {formatNumber(count)}
        {stat.suffix}
      </div>
      <div className={classes.statLabelMinimal}>{label}</div>
    </div>
  );
}

interface PublicStatsResponse {
  data: {
    totalQuestions: number;
    totalPackages: number;
    totalTopics: number;
    activeUsers: number;
  };
}

export function Stats_Section() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Fetch real public data from API (100% unauthenticated safe)
  const { data: publicStatsData } = useSWR<PublicStatsResponse>(
    "/api/v1/public/stats",
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  const statsObj = publicStatsData?.data;
  const totalQuestions = statsObj?.totalQuestions && statsObj.totalQuestions > 0 ? statsObj.totalQuestions : 1200;

  const stats: StatItem[] = [
    {
      value: totalQuestions,
      suffix: "+",
      labelKey: "home.landingStats.questions",
      defaultLabel: "Savollar",
    },
    {
      value: 70,
      suffix: "",
      labelKey: "home.landingStats.tickets",
      defaultLabel: "Biletlar",
    },
    {
      value: 100,
      suffix: "%",
      labelKey: "home.landingStats.realExam",
      defaultLabel: "Real imtihon",
    },
    {
      value: 3,
      suffix: "",
      labelKey: "home.landingStats.languages",
      defaultLabel: "Mavjud tillar",
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
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className={classes.statsMinimalSection} ref={sectionRef} aria-label="Statistics">
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing={{ base: "sm", md: "md" }}>
        {stats.map((stat) => (
          <StatCard
            key={stat.labelKey}
            stat={stat}
            isVisible={isVisible}
            label={t(stat.labelKey, stat.defaultLabel)}
          />
        ))}
      </SimpleGrid>
    </section>
  );
}
