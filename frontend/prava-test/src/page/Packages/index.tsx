import { Package_List } from "../../features/Package";
import SEO from "../../components/common/SEO";

const Packages_Page = () => {
  return (
    <div>
      <SEO
        title="Paketlar - Imtihon paketlari"
        description="Haydovchilik guvohnomasi imtihoni paketlarini tanlang va o'zingizga mos test to'plamini yeching."
        canonical="/packages"
        noIndex={true}
      />
      <Package_List />
    </div>
  );
};

export default Packages_Page;
