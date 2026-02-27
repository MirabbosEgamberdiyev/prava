import { LeaderboardPage } from "../../features/Leaderboard";
import SEO from "../../components/common/SEO";

const Leaderboard_Page = () => {
  return (
    <>
      <SEO
        title="Reyting - Eng yaxshi natijalar"
        description="Prava Online platformasida eng yaxshi natijalarni ko'rsatgan foydalanuvchilar reytingi."
        canonical="/leaderboard"
        noIndex={true}
      />
      <LeaderboardPage />
    </>
  );
};

export default Leaderboard_Page;
