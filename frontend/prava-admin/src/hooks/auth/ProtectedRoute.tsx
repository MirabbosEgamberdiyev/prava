import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Center, Loader } from "@mantine/core";

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation(); // Foydalanuvchi qaysi sahifaga kirmoqchi bo'lganini saqlaymiz

  // 1. Ma'lumotlar kuki'dan o'qilayotgan bo'lsa, yuklanish ekranini ko'rsatamiz
  if (loading) {
    return (
      <Center style={{ height: "100vh" }}>
        <Loader size="xl" color="blue" type="bars" />
      </Center>
    );
  }

  // 2. Agar login qilmagan bo'lsa, login sahifasiga yuboramiz
  // state={{ from: location }} - login qilgandan keyin qaytib kelish uchun kerak
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  // 3. Login bo'lgan bo'lsa, sahifani ko'rsatamiz
  return <Outlet />;
};

export default ProtectedRoute;
