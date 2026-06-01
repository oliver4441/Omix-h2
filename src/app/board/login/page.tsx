"use client";
import { Suspense } from "react";
import DepartmentLogin from "@/components/auth/DepartmentLogin";
import { Building2 } from "lucide-react";
export const dynamic = "force-dynamic";

function BoardLoginPage() {
  return (
    <DepartmentLogin
      department="Board of Management"
      departmentName="Board of Management"
      requiredRole="board_member"
      icon={<Building2 className="w-10 h-10 text-white" />}
      dashboardPath="/board/dashboard"
    />
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>}>
      <BoardLoginPage />
    </Suspense>
  );
}
