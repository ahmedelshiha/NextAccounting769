"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Search, Check, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  countryScope: string[];
  pricing: {
    amount: number;
    currency: string;
    unit: string;
  };
  prerequisites?: string[];
  sla?: {
    turnaroundTime: string;
    responseTime: string;
  };
  icon?: string;
}

export function ServicesDirectory() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState<string | null>(null);
  const [requestedServices, setRequestedServices] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    search: "",
    country: "",
    category: "",
  });

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();

        if (filters.search) params.append("search", filters.search);
        if (filters.country) params.append("country", filters.country);
        if (filters.category) params.append("category", filters.category);

        const response = await fetch(`/api/services?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch services");

        const data = await response.json();
        setServices(data.data.services);
        setCategories(data.data.categories);
      } catch (error) {
        toast.error("Failed to load services");
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, [filters]);

  const handleRequestService = async (serviceId: string, serviceName: string) => {
    try {
      setIsRequesting(serviceId);

      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId }),
      });

      if (!response.ok) throw new Error("Failed to request service");

      const data = await response.json();
      setRequestedServices((prev) => new Set(prev).add(serviceId));
      toast.success(`Request sent for ${serviceName}`);
    } catch (error) {
      toast.error("Failed to send request");
    } finally {
      setIsRequesting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Services Catalog</h2>
        <p className="text-gray-600 mt-2">
          Browse and request tax, compliance, and accounting services
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search services..."
                className="pl-10"
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
              />
            </div>

            {/* Country Filter */}
            <Select
              value={filters.country}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, country: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Countries</SelectItem>
                <SelectItem value="AE">🇦🇪 UAE</SelectItem>
                <SelectItem value="SA">🇸🇦 Saudi Arabia</SelectItem>
                <SelectItem value="EG">🇪🇬 Egypt</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select
              value={filters.category}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : services.length === 0 ? (
        <Alert>
          <AlertDescription>No services found. Try adjusting your filters.</AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <Card key={service.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-2xl mb-2">{service.icon || "📋"}</div>
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {service.category}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                {/* Description */}
                <p className="text-sm text-gray-700">{service.description}</p>

                {/* Countries */}
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-600">
                    {service.countryScope.map((c) => {
                      const flags: Record<string, string> = {
                        AE: "🇦🇪",
                        SA: "🇸🇦",
                        EG: "🇪🇬",
                      };
                      return flags[c];
                    }).join(" ")}
                  </span>
                </div>

                {/* Pricing */}
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-sm font-semibold">
                    {service.pricing.amount.toLocaleString()}{" "}
                    {service.pricing.currency}
                  </p>
                  <p className="text-xs text-gray-600">{service.pricing.unit}</p>
                </div>

                {/* SLA */}
                {service.sla && (
                  <div className="bg-gray-50 p-3 rounded space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        Turnaround: {service.sla.turnaroundTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        Response: {service.sla.responseTime}
                      </span>
                    </div>
                  </div>
                )}

                {/* Prerequisites */}
                {service.prerequisites && service.prerequisites.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-2">Prerequisites:</p>
                    <ul className="space-y-1">
                      {service.prerequisites.map((pre, index) => (
                        <li key={index} className="text-xs text-gray-600 flex items-center gap-1">
                          <span className="text-gray-400">•</span> {pre}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Request Button */}
                <Button
                  className="w-full mt-auto"
                  onClick={() => handleRequestService(service.id, service.name)}
                  disabled={
                    isRequesting === service.id ||
                    requestedServices.has(service.id)
                  }
                >
                  {isRequesting === service.id && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {requestedServices.has(service.id) ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Requested
                    </>
                  ) : (
                    "Request Service"
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Alert */}
      <Alert>
        <AlertDescription>
          Request a service to start working with our team. You&apos;ll be able to track your request and
          communicate directly with our specialists through the messaging system.
        </AlertDescription>
      </Alert>
    </div>
  );
}
