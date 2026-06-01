import DepartmentLayout from "@/components/layouts/DepartmentLayout";

export default function DepartmentsDashboardLayout({ children }: { children: React.ReactNode }) {
  return <DepartmentLayout department="bursar">{children}</DepartmentLayout>;
}
