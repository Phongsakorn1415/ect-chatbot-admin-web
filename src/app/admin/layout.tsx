import React from 'react';
import AdminLayout from '@/lib/layouts/admin';
import { Metadata } from 'next';
import { parseDuration } from '@/lib/utils/duration';

export const metadata: Metadata = {
  title: "ECT Chatbot AdminTool",
  description: "Admin panel for managing ECT Chatbot",
};

export default function AdminRouteLayout({ children }: { children: React.ReactNode }) {
  const maxAge = parseDuration(process.env.JWT_EXPIRES_IN || "1d") + 86400; // 1 day extra

  return (
    <AdminLayout wasLoggedInMaxAge={maxAge}>
      {children}
    </AdminLayout>
  );
}
