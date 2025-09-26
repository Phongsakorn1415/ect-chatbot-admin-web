import React from 'react';
import AdminLayout from '@/lib/layouts/admin';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "ECT Chatbot AdminTool",
  description: "Admin panel for managing ECT Chatbot",
};

export default function AdminRouteLayout({ children }: { children: React.ReactNode }) {
	return (
		<AdminLayout>
			{children}
		</AdminLayout>
	);
}
