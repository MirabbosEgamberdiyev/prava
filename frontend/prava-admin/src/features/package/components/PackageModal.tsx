// features/package/components/PackageModal.tsx

import { Modal } from "@mantine/core";
import { PackageForm } from "./PackageForm";
import type { PackageFormData } from "../types";

interface PackageModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: PackageFormData) => Promise<void>;
  initialValues?: Partial<PackageFormData>;
  title: string;
  topics?: Array<{ value: string; label: string }>;
  questions?: Array<{ value: string; label: string }>;
  loading?: boolean;
}

export function PackageModal({
  opened,
  onClose,
  onSubmit,
  initialValues,
  title,
  topics,
  questions,
  loading,
}: PackageModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      size="xl"
      closeOnClickOutside={false}
    >
      <PackageForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        onCancel={onClose}
        topics={topics}
        questions={questions}
        loading={loading}
      />
    </Modal>
  );
}
