// page/Packages/Add_Package_Page.tsx

import { useNavigate } from "react-router-dom";
import { Paper, Title, Stack, Breadcrumbs, Anchor } from "@mantine/core";
import { useTranslation } from "react-i18next";

import {
  PackageForm,
  useCreatePackage,
  type PackageFormData,
} from "../../../features/package";
import { useTopicOptions } from "../../../features/topic/hooks/useTopics";

function Add_Package_Page() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { createPackage, loading } = useCreatePackage();
  const { options: topicOptions } = useTopicOptions();

  const handleSubmit = async (values: PackageFormData) => {
    try {
      await createPackage(values);
      navigate("/packages");
    } catch (error) {
      console.error("Create error:", error);
    }
  };

  const handleCancel = () => {
    navigate("/packages");
  };

  const breadcrumbItems = [
    { title: t("breadcrumb.home"), href: "/" },
    { title: t("packages.title"), href: "/packages" },
    { title: t("packages.addNew"), href: "#" },
  ];

  return (
    <>
      <Stack gap="md">
        <Breadcrumbs>
          {breadcrumbItems.map((item, index) =>
            item.href === "#" ? (
              <span key={index}>{item.title}</span>
            ) : (
              <Anchor key={index} onClick={() => navigate(item.href)}>
                {item.title}
              </Anchor>
            ),
          )}
        </Breadcrumbs>

        <Paper p="md" withBorder>
          <Title order={2} mb="md">
            {t("packages.addNew")}
          </Title>

          <PackageForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            topics={topicOptions}
            loading={loading}
          />
        </Paper>
      </Stack>
    </>
  );
}

export default Add_Package_Page;
