// page/Packages/index.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Paper,
  Title,
  Button,
  Group,
  Stack,
  LoadingOverlay,
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { notifications } from "@mantine/notifications";

import {
  usePackages,
  useDeletePackage,
  useTogglePackageStatus,
  useRegenerateQuestions,
  useAttachQuestions,
} from "../../features/package/hook";

import { PackageFiltersComponent } from "../../features/package/components/PackageFilters";
import { PackagePagination } from "../../features/package/components/PackagePagination";
import {
  openDeleteConfirmModal,
  openToggleConfirmModal,
  openRegenerateConfirmModal,
} from "../../features/package/components/PackageDeleteModal";
import { AttachQuestionsModal } from "../../features/package/components/AttachQuestionsModal";

import type { PackageFilters } from "../../features/package/types";
import { PackageGrid } from "../../features/package/components/PackageGrid";
import { useTopicOptions } from "../../features/topic/hooks/useTopics";

function Packages_Page() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [filters, setFilters] = useState<PackageFilters>({});
  const [attachModalOpened, setAttachModalOpened] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(
    null,
  );

  const { options: topicOptions } = useTopicOptions();
  const { packages, pagination, isLoading, mutate } = usePackages(
    page,
    size,
    filters,
  );
  const { deletePackage, loading: deleteLoading } = useDeletePackage();
  const { toggleStatus, loading: toggleLoading } = useTogglePackageStatus();
  const { regenerate, loading: regenerateLoading } = useRegenerateQuestions();
  const { attachQuestions, loading: attachLoading } = useAttachQuestions();

  // Handlers
  const handleCreate = () => {
    navigate("/packages/add");
  };

  const handleEdit = (id: number) => {
    navigate(`/packages/edit/${id}`);
  };

  const handleDelete = (id: number) => {
    const pkg = packages.find((p) => p.id === id);
    if (!pkg) return;

    openDeleteConfirmModal(pkg.name, async () => {
      try {
        await deletePackage(id);
        mutate();
      } catch (error: any) {
        notifications.show({
          title: t("common.error"),
          message: error?.response?.data?.message || t("packages.deleteError"),
          color: "red",
        });
      }
    });
  };

  const handleToggleStatus = (id: number) => {
    const pkg = packages.find((p) => p.id === id);
    if (!pkg) return;

    openToggleConfirmModal(pkg.name, pkg.isActive, async () => {
      try {
        await toggleStatus(id);
        mutate();
      } catch (error: any) {
        notifications.show({
          title: t("common.error"),
          message: error?.response?.data?.message || t("packages.statusChangeError"),
          color: "red",
        });
      }
    });
  };

  const handleRegenerate = (id: number) => {
    const pkg = packages.find((p) => p.id === id);
    if (!pkg) return;

    openRegenerateConfirmModal(pkg.name, async () => {
      try {
        await regenerate(id);
        mutate();
      } catch (error: any) {
        notifications.show({
          title: t("common.error"),
          message: error?.response?.data?.message || t("packages.regenerateError"),
          color: "red",
        });
      }
    });
  };

  const handleOpenAttachModal = (id: number) => {
    setSelectedPackageId(id);
    setAttachModalOpened(true);
  };

  const handleAttachQuestions = async (questionIds: number[]) => {
    if (!selectedPackageId) return;
    const questionCount =
      packages.find((p) => p.id === selectedPackageId)?.questionCount || 0;
    try {
      await attachQuestions(selectedPackageId, questionCount, questionIds);
      mutate();
    } catch (error: any) {
      notifications.show({
        title: t("common.error"),
        message: error?.response?.data?.message || t("packages.attachError"),
        color: "red",
      });
    }
  };

  const handleFilter = (newFilters: PackageFilters) => {
    setFilters(newFilters);
    setPage(0);
  };

  const handleResetFilters = () => {
    setFilters({});
    setPage(0);
  };

  const isActionLoading =
    deleteLoading || toggleLoading || regenerateLoading || attachLoading;

  const selectedPackage = packages.find((p) => p.id === selectedPackageId);

  return (
    <>
      <Stack gap="md">
        <Paper p="md" withBorder>
          <Group justify="space-between" mb="md">
            <Title order={2}>{t("packages.title")}</Title>
            <Button leftSection={<IconPlus size={16} />} onClick={handleCreate}>
              {t("packages.addNew")}
            </Button>
          </Group>

          <PackageFiltersComponent
            onFilter={handleFilter}
            onReset={handleResetFilters}
            topics={topicOptions}
          />
        </Paper>

        <>
          <LoadingOverlay visible={isLoading || isActionLoading} />

          <PackageGrid
            packages={packages}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            onRegenerate={handleRegenerate}
            onAttachQuestions={handleOpenAttachModal}
            loading={isLoading}
          />

          {pagination && pagination.totalPages > 1 && (
            <PackagePagination
              page={page}
              totalPages={pagination.totalPages}
              size={size}
              totalElements={pagination.totalElements}
              onPageChange={setPage}
              onSizeChange={(newSize) => {
                setSize(newSize);
                setPage(0);
              }}
            />
          )}
        </>
      </Stack>

      {/* Attach Questions Modal */}
      <AttachQuestionsModal
        opened={attachModalOpened}
        onClose={() => {
          setAttachModalOpened(false);
          setSelectedPackageId(null);
        }}
        packageId={selectedPackageId || 0}
        packageName={selectedPackage?.name || ""}
        onAttach={handleAttachQuestions}
      />
    </>
  );
}

export default Packages_Page;
