import { Paper, Skeleton, Stack } from "@mantine/core";

interface SkeletonCardProps {
  height?: number;
}

export function SkeletonCard({ height = 200 }: SkeletonCardProps) {
  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="sm">
        <Skeleton height={height * 0.6} radius="sm" />
        <Skeleton height={16} radius="sm" width="70%" />
        <Skeleton height={12} radius="sm" width="40%" />
      </Stack>
    </Paper>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </>
  );
}
