import React, { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { IconArrowLeft, IconChevronRight, IconSparkles } from "@tabler/icons-react";
import { Accordion } from "@mantine/core";
import { useTranslation } from "react-i18next";
import classes from "./AuthLayout.module.css";
import SEO from "@/components/common/SEO";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AuthLayoutProps {
  children: ReactNode;
  leftColumn?: ReactNode;
  rightColumn?: ReactNode;
  backLink?: {
    href: string;
    label: string;
  };
  stepIndicator?: string;
  breadcrumbs?: BreadcrumbItem[];
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  leftColumn,
  rightColumn,
  backLink,
  stepIndicator,
  breadcrumbs,
  seoTitle,
  seoDescription,
  canonicalUrl,
}) => {
  const { t } = useTranslation();

  return (
    <div className={classes.authLayoutRoot}>
      <SEO
        title={seoTitle}
        description={seoDescription}
        canonical={canonicalUrl}
        noIndex={true}
      />

      <div className={classes.authContainer}>
        {/* Sub-header Navigation row (Back link or Breadcrumbs, plus Step indicator) */}
        {(backLink || stepIndicator || (breadcrumbs && breadcrumbs.length > 0)) && (
          <div className={classes.subHeaderRow}>
            <div>
              {backLink && (
                <Link to={backLink.href} className={classes.backLink}>
                  <IconArrowLeft size={16} />
                  <span>{backLink.label}</span>
                </Link>
              )}

              {breadcrumbs && breadcrumbs.length > 0 && (
                <nav aria-label={t("common.breadcrumbs", "Breadcrumbs")} className={classes.breadcrumbRow}>
                  {breadcrumbs.map((item, idx) => {
                    const isLast = idx === breadcrumbs.length - 1;
                    return (
                      <React.Fragment key={item.label}>
                        {idx > 0 && <IconChevronRight size={14} color="#94a3b8" />}
                        {isLast || !item.href ? (
                          <span className={classes.breadcrumbCurrent} aria-current={isLast ? "page" : undefined}>
                            {item.label}
                          </span>
                        ) : (
                          <Link to={item.href} className={classes.breadcrumbLink}>
                            {item.label}
                          </Link>
                        )}
                      </React.Fragment>
                    );
                  })}
                </nav>
              )}
            </div>

            {stepIndicator && (
              <div className={classes.stepIndicatorBadge} aria-label={stepIndicator}>
                {stepIndicator}
              </div>
            )}
          </div>
        )}

        {/* 3-Column Grid Composition on Desktop */}
        <div className={classes.threeColGrid}>
          {leftColumn && <aside className={classes.leftCol}>{leftColumn}</aside>}
          <main className={classes.centerCol}>{children}</main>
          {rightColumn && <aside className={classes.rightCol}>{rightColumn}</aside>}
        </div>

        {/* Mobile Accordion: Collapses benefits under the form on mobile devices */}
        {(leftColumn || rightColumn) && (
          <div className={classes.mobileAccordionWrapper}>
            <Accordion variant="separated" radius="md">
              <Accordion.Item value="platform-benefits">
                <Accordion.Control icon={<IconSparkles size={18} color="var(--primary, #2196F3)" />}>
                  <span className={classes.mobileAccordionTitle}>
                    {t("authV2.mobileFeaturesToggle", "Platforma imkoniyatlari va afzalliklari")}
                  </span>
                </Accordion.Control>
                <Accordion.Panel>
                  <div className={classes.mobilePanelContent}>
                    {leftColumn}
                    {rightColumn}
                  </div>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthLayout;
