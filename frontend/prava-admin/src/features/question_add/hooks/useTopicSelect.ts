import useSWR from "swr";
import api from "../../../services/api";
import type { Topic } from "../../topic";

export const useTopicSelect = () => {
  // Barcha mavzularni olish (pagination-siz yoki katta limit bilan)
  const { data, isLoading } = useSWR("/api/v1/admin/topics", async (url) => {
    const res = await api.get(url);
    return res.data.data.content;
  });

  // Select komponenti uchun ma'lumotni tayyorlash
  const selectData =
    data?.map((topic: Topic) => ({
      value: topic.id.toString(),
      // Tilga qarab mavzu nomini tanlash
      label: topic.name || topic.code,
    })) || [];

  return {
    topicOptions: selectData,
    isLoading,
  };
};
