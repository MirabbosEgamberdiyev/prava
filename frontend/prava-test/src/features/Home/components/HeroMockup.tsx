import React from "react";
import { useTranslation } from "react-i18next";
import { IconClock, IconCheck, IconStar, IconAward } from "@tabler/icons-react";
import classes from "./Home.module.css";

export const HeroMockup = React.memo(() => {
  const { t } = useTranslation();

  return (
    <div className={classes.heroMockupContainer} aria-hidden="true">
      {/* Floating Badge 1: Top Right */}
      <div className={`${classes.heroFloatingBadge} ${classes.floatingBadgeTop}`}>
        <div className={classes.floatingBadgeIcon} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
          <IconCheck size={18} stroke={2.5} />
        </div>
        <div>
          <div className={classes.floatingBadgeTitle}>{t("home.hero.badgeOfficial", "100% Rasmiy savollar")}</div>
          <div className={classes.floatingBadgeSub}>{t("home.hero.badgeOfficialSub", "IIV YHXBB standarti")}</div>
        </div>
      </div>

      {/* Main Laptop Mockup */}
      <div className={classes.laptopWrapper}>
        <div className={classes.laptopScreen}>
          {/* Laptop Browser Header Bar */}
          <div className={classes.laptopBrowserHeader}>
            <div className={classes.laptopDots}>
              <span className={classes.dotRed} />
              <span className={classes.dotYellow} />
              <span className={classes.dotGreen} />
            </div>
            <div className={classes.laptopAddressBar}>
              web.pravaonline.uz/exam/simulation
            </div>
          </div>

          {/* Exam Interface Inside Screen */}
          <div className={classes.examInterface}>
            {/* Top Exam Status Bar */}
            <div className={classes.examTopBar}>
              <div className={classes.examQuestionCount}>
                <span className={classes.examQBadge}>12 / 20</span>
                <span className={classes.examTicketLabel}>{t("home.hero.ticketLabel", "Bilet 14")}</span>
              </div>
              <div className={classes.examTimer}>
                <IconClock size={15} />
                <span>14:35</span>
              </div>
            </div>

            {/* Illustration Graphic: Realistic Crossroads SVG */}
            <div className={classes.examGraphicWrapper}>
              <svg
                viewBox="0 0 340 130"
                className={classes.crossroadsSvg}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Grass / Background */}
                <rect width="340" height="130" fill="#2d3748" rx="8" />
                
                {/* Horizontal Road */}
                <rect x="0" y="45" width="340" height="40" fill="#1a202c" />
                <line x1="0" y1="65" x2="340" y2="65" stroke="#ecc94b" strokeWidth="2" strokeDasharray="8 6" />
                
                {/* Vertical Road */}
                <rect x="150" y="0" width="40" height="130" fill="#1a202c" />
                <line x1="170" y1="0" x2="170" y2="130" stroke="#ecc94b" strokeWidth="2" strokeDasharray="8 6" />
                
                {/* Intersection Center Box */}
                <rect x="150" y="45" width="40" height="40" fill="#1a202c" />
                
                {/* Pedestrian Crossings (White Zebra Stripes) */}
                <rect x="115" y="47" width="4" height="36" fill="#fff" opacity="0.85" />
                <rect x="123" y="47" width="4" height="36" fill="#fff" opacity="0.85" />
                <rect x="131" y="47" width="4" height="36" fill="#fff" opacity="0.85" />
                <rect x="139" y="47" width="4" height="36" fill="#fff" opacity="0.85" />
                
                <rect x="197" y="47" width="4" height="36" fill="#fff" opacity="0.85" />
                <rect x="205" y="47" width="4" height="36" fill="#fff" opacity="0.85" />
                <rect x="213" y="47" width="4" height="36" fill="#fff" opacity="0.85" />
                <rect x="221" y="47" width="4" height="36" fill="#fff" opacity="0.85" />

                {/* Car 1 (Blue - Coming from Left) */}
                <g transform="translate(60, 52)">
                  <rect width="36" height="18" rx="4" fill="#0b84f3" />
                  <rect x="8" y="2" width="14" height="14" rx="2" fill="#93c5fd" opacity="0.8" />
                  <circle cx="28" cy="4" r="2.5" fill="#fef08a" />
                  <circle cx="28" cy="14" r="2.5" fill="#fef08a" />
                  <text x="12" y="13" fontSize="8" fontWeight="bold" fill="#fff">1</text>
                </g>

                {/* Car 2 (Red - Coming from Bottom turning Left) */}
                <g transform="translate(155, 95)">
                  <rect width="18" height="30" rx="4" fill="#ef4444" />
                  <rect x="2" y="8" width="14" height="12" rx="2" fill="#fca5a5" opacity="0.8" />
                  <circle cx="4" cy="4" r="2" fill="#fef08a" />
                  <circle cx="14" cy="4" r="2" fill="#fef08a" />
                  <text x="7" y="18" fontSize="8" fontWeight="bold" fill="#fff">2</text>
                </g>

                {/* Traffic Light / Sign */}
                <g transform="translate(138, 30)">
                  <rect width="8" height="15" rx="2" fill="#111827" />
                  <circle cx="4" cy="4" r="2" fill="#ef4444" opacity="0.4" />
                  <circle cx="4" cy="8" r="2" fill="#f59e0b" opacity="0.4" />
                  <circle cx="4" cy="12" r="2" fill="#10b981" />
                </g>
              </svg>
            </div>

            {/* Question Text */}
            <div className={classes.examQuestionText}>
              {t("home.hero.sampleQuestion", "Ushbu chorrahada birinchi bo'lib qaysi transport vositasi harakatlanadi?")}
            </div>

            {/* Option Buttons with F1-F4 Hotkeys */}
            <div className={classes.examOptionsGrid}>
              <div className={`${classes.examOptionBtn} ${classes.examOptionActive}`}>
                <span className={classes.examKeyBadge}>F1</span>
                <span className={classes.examOptionText}>{t("home.hero.sampleOpt1", "1-raqamli ko'k avtomobil")}</span>
              </div>
              <div className={classes.examOptionBtn}>
                <span className={classes.examKeyBadge}>F2</span>
                <span className={classes.examOptionText}>{t("home.hero.sampleOpt2", "2-raqamli qizil avtomobil")}</span>
              </div>
              <div className={classes.examOptionBtn}>
                <span className={classes.examKeyBadge}>F3</span>
                <span className={classes.examOptionText}>{t("home.hero.sampleOpt3", "Bir vaqtning o'zida kelishib")}</span>
              </div>
              <div className={classes.examOptionBtn}>
                <span className={classes.examKeyBadge}>F4</span>
                <span className={classes.examOptionText}>{t("home.hero.sampleOpt4", "O'ngdan xavf qoidasi asosida")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Laptop Base Stand */}
        <div className={classes.laptopBase}>
          <div className={classes.laptopNotch} />
        </div>
      </div>

      {/* Floating Smartphone Mockup (Overlapping Bottom Right) */}
      <div className={classes.heroPhoneWrapper}>
        <div className={classes.phoneBezel}>
          <div className={classes.phoneSpeaker} />
          <div className={classes.phoneScreenInner}>
            <div className={classes.phoneHeader}>
              <span className={classes.phoneTime}>09:41</span>
              <span className={classes.phoneSignal}>●●● 5G</span>
            </div>
            
            <div className={classes.phoneUserCard}>
              <div className={classes.phoneAvatarRing}>
                <IconAward size={18} color="#0b84f3" />
              </div>
              <div>
                <div className={classes.phoneUserName}>{t("home.hero.phoneUser", "Tayyorgarlik")}</div>
                <div className={classes.phoneUserScore}>68% {t("home.hero.phoneScore", "o'zlashtirildi")}</div>
              </div>
            </div>

            {/* Mini Progress Bar */}
            <div className={classes.phoneProgressWrapper}>
              <div className={classes.phoneProgressBar}>
                <div className={classes.phoneProgressFill} style={{ width: "68%" }} />
              </div>
              <div className={classes.phoneProgressMeta}>
                <span>{t("home.hero.phoneBiletCount", "48 / 70 bilet")}</span>
                <span>{t("home.hero.phoneAccuracy", "94% aniqlik")}</span>
              </div>
            </div>

            {/* Quick action pill */}
            <div className={classes.phoneActionBadge}>
              <IconCheck size={13} color="#10b981" />
              <span>{t("home.hero.phoneReady", "Imtihonga tayyormisiz?")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Badge 2: Bottom Left */}
      <div className={`${classes.heroFloatingBadge} ${classes.floatingBadgeBottom}`}>
        <div className={classes.floatingBadgeIcon} style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
          <IconStar size={18} stroke={2.5} />
        </div>
        <div>
          <div className={classes.floatingBadgeTitle}>4.9 / 5.0</div>
          <div className={classes.floatingBadgeSub}>{t("home.hero.badgeRatingSub", "15,000+ muvaffaqiyatli haydovchi")}</div>
        </div>
      </div>
    </div>
  );
});

HeroMockup.displayName = "HeroMockup";
