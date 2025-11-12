import { Metadata } from "next";
import { ServicesDirectory } from "@/components/portal/ServicesDirectory";

export const metadata: Metadata = {
  title: "Services Catalog | Client Portal",
  description: "Browse and request tax, compliance, and accounting services",
};

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <ServicesDirectory />
      </div>
    </div>
  );
}
