import { useEffect, useState, useRef } from "react";
import { SimpleGrid } from "@mantine/core";
import { useTranslation } from "react-i18next";
import {
  IconListCheck,
  IconFileText,
  IconAward,
  IconLanguage,
} from "@tabler/icons-react";
import useSWR from "swr";
import { getCachedTotalQuestions, getCachedTotalTickets } from "../../../services/desktopAdapter";
import classes from "./Home.module.css";

// Counter animation hook
function useCountUp(
  end: number,
  duration: number = 1800,
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

      // Easing function: easeOutQuart
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

function formatNumber(num: number): string {
  return num.toLocaleString("uz-UZ");
}

interface StatItem {
  value: number;
  suffix: string;
  labelKey: string;
  defaultLabel: string;
  subKey: string;
  defaultSub: string;
  icon: typeof IconListCheck;
  color: string;
  bg: string;
}

function StatCard({
  stat,
  isVisible,
}: {
  stat: StatItem;
  isVisible: boolean;
}) {
  const { t } = useTranslation();
  const count = useCountUp(stat.value, 1600, isVisible);
  const IconComponent = stat.icon;

  return (
    <div className={classes.statCardModern}>
      <div
        className={classes.statIconCircle}
        style={{ backgroundColor: stat.bg, color: stat.color }}
      >
        <IconComponent size={24} stroke={2} />
      </div>
      <div className={classes.statValueModern}>
        {formatNumber(count)}
        {stat.suffix}
      </div>
      <div className={classes.statLabelModern}>
        {t(stat.labelKey, stat.defaultLabel)}
      </div>
      <div className={classes.statSubModern}>
        {t(stat.subKey, stat.defaultSub)}
      </div>
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

  // Fetch real public data from API
  const { data: publicStatsData } = useSWR<PublicStatsResponse>(
    "/api/v1/public/stats",
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  const statsObj = publicStatsData?.data;
  // Rasmiy savollar soni: API'dan olingan aniq son yoki bazadan
  const totalQuestions = statsObj?.totalQuestions && statsObj.totalQuestions > 0 ? statsObj.totalQuestions : getCachedTotalQuestions();
  const totalTickets = (statsObj as any)?.totalTickets || getCachedTotalTickets();

  const stats: StatItem[] = [
    {
      value: totalQuestions,
      suffix: "+",
      labelKey: "home.landingStats.questions",
      defaultLabel: "Savollar bazasi",
      subKey: "home.landingStats.questionsSub",
      defaultSub: "IIV YHXBB rasmiy savollari",
      icon: IconListCheck,
      color: "#0b84f3",
      bg: "rgba(11, 132, 243, 0.1)",
    },
    {
      value: totalTickets,
      suffix: "",
      labelKey: "home.landingStats.tickets",
      defaultLabel: "Rasmiy biletlar",
      subKey: "home.landingStats.ticketsSub",
      defaultSub: "To'liq va aniq izohlar",
      icon: IconFileText,
      color: "#10b981",
      bg: "rgba(16, 185, 129, 0.1)",
    },
    {
      value: 100,
      suffix: "%",
      labelKey: "home.landingStats.realExam",
      defaultLabel: "Real imtihon",
      subKey: "home.landingStats.realExamSub",
      defaultSub: "Davlat imtihoni formatida",
      icon: IconAward,
      color: "#06b6d4",
      bg: "rgba(6, 182, 212, 0.1)",
    },
    {
      value: 3,
      suffix: "",
      labelKey: "home.landingStats.languages",
      defaultLabel: "Mavjud tillar",
      subKey: "home.landingStats.languagesSub",
      defaultSub: "O'zbek (Lotin, Kiril), Rus tili",
      icon: IconLanguage,
      color: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.1)",
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
    <section className={classes.statsModernSection} ref={sectionRef} aria-label={t("home.stats.ariaLabel", "Statistika")}>
      <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing={{ base: "md", md: "lg" }}>
        {stats.map((stat) => (
          <StatCard
            key={stat.labelKey}
            stat={stat}
            isVisible={isVisible}
          />
        ))}
      </SimpleGrid>
    </section>
  );
}
