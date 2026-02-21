// page/Packages/Edit_Package_Page.tsx

import { useParams, useNavigate } from "react-router-dom";
import {
  Paper,
  Title,
  Stack,
  Breadcrumbs,
  Anchor,
  LoadingOverlay,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import {
  EditPackageForm,
  usePackageDetail,
  useUpdatePackage,
  type PackageFormData,
} from "../../../features/package";
import { useTopicOptions } from "../../../features/topic/hooks/useTopics";

function Edit_Package_Page() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { updatePackage, loading: updateLoading } = useUpdatePackage();
  const { package: packageData, isLoading } = usePackageDetail(
    id ? parseInt(id) : null,
  );
  const { options: topicOptions } = useTopicOptions();

  const handleSubmit = async (values: Partial<PackageFormData>) => {
    if (!id) return;

    try {
      await updatePackage(parseInt(id), values as PackageFormData);
      navigate("/packages");
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  const handleCancel = () => {
    navigate("/packages");
  };

  const breadcrumbItems = [
    { title: t("breadcrumb.home"), href: "/" },
    { title: t("packages.title"), href: "/packages" },
    { title: t("common.edit"), href: "#" },
  ];

  if (isLoading || !packageData) {
    return (
      <Paper p="md" withBorder pos="relative" h={400}>
        <LoadingOverlay visible />
      </Paper>
    );
  }

  return (
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
          {t("packages.editPackage")}
        </Title>

        <EditPackageForm
          initialData={packageData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          topics={topicOptions}
          loading={updateLoading}
        />
      </Paper>
    </Stack>
  );
}

export default Edit_Package_Page;
