"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { Loader2, Search, Check, Clock, MapPin, MessageSquare } from "lucide-react";
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

interface ServiceRequestData {
  serviceId: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}

export function ServicesDirectory() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState<string | null>(null);
  const [requestedServices, setRequestedServices] = useState<Set<string>>(new Set());
  const [searchSuggestions, setSearchSuggestions] = useState<Service[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
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

    const debounceTimer = setTimeout(() => {
      fetchServices();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [filters]);

  // Handle search input with typeahead
  const handleSearchChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    
    if (value.length > 0) {
      // Generate suggestions from current services
      const suggestions = services
        .filter(
          (s) =>
            s.name.toLowerCase().includes(value.toLowerCase()) ||
            s.description.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 5);
      setSearchSuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [services]);

  // Handle suggestion selection
  const handleSuggestionSelect = (service: Service) => {
    setFilters((prev) => ({ ...prev, search: service.name }));
    setShowSuggestions(false);
    if (searchInputRef.current) {
      searchInputRef.current.value = service.name;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRequestService = async (serviceId: string, serviceName: string) => {
    try {
      setIsRequesting(serviceId);

      // First, create a service request
      const serviceRequestResponse = await fetch("/api/portal/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          title: `Request for ${serviceName}`,
          description: `Client requested service: ${serviceName}`,
          priority: "MEDIUM",
          isBooking: false,
        } as ServiceRequestData),
      });

      if (!serviceRequestResponse.ok) {
        throw new Error("Failed to create service request");
      }

      const requestData = await serviceRequestResponse.json();
      const serviceRequestId = requestData.data?.id;

      // Then, create a messaging case linked to the service request
      if (serviceRequestId) {
        try {
          const messagingResponse = await fetch("/api/portal/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: `I would like to request the ${serviceName} service. Please provide more details and pricing information.`,
              room: `service-request-${serviceRequestId}`,
            }),
          });

          if (!messagingResponse.ok) {
            console.warn("Failed to create messaging case, but service request was created");
          }
        } catch (messagingError) {
          console.warn("Messaging integration failed:", messagingError);
          // Don't fail the entire operation if messaging fails
        }
      }

      setRequestedServices((prev) => new Set(prev).add(serviceId));
      toast.success(`Request sent for ${serviceName}. Our team will contact you shortly.`);
    } catch (error) {
      console.error("Error requesting service:", error);
      toast.error("Failed to send request. Please try again.");
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
            {/* Search with Typeahead */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                placeholder="Search services..."
                className="pl-10"
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => filters.search.length > 0 && setShowSuggestions(true)}
                aria-label="Search services"
                aria-autocomplete="list"
                aria-controls="search-suggestions"
                role="combobox"
                aria-expanded={showSuggestions}
              />
              
              {/* Search Suggestions Dropdown */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  id="search-suggestions"
                  className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10"
                  role="listbox"
                >
                  {searchSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b last:border-b-0"
                      onClick={() => handleSuggestionSelect(suggestion)}
                      role="option"
                      aria-selected={filters.search === suggestion.name}
                    >
                      <div className="font-medium text-sm">{suggestion.name}</div>
                      <div className="text-xs text-gray-600">{suggestion.category}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Country Filter */}
            <Select
              value={filters.country}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, country: value }))
              }
            >
              <SelectTrigger aria-label="Filter by country">
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
              <SelectTrigger aria-label="Filter by category">
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
        <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading services...</span>
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
                    <div className="text-2xl mb-2" aria-hidden="true">
                      {service.icon || "📋"}
                    </div>
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
                  <MapPin className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  <span className="text-xs text-gray-600" aria-label="Available countries">
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
                      <Clock className="h-4 w-4 text-gray-400" aria-hidden="true" />
                      <span className="text-xs text-gray-600">
                        Turnaround: {service.sla.turnaroundTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" aria-hidden="true" />
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
                          <span className="text-gray-400" aria-hidden="true">•</span> {pre}
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
                  aria-label={
                    requestedServices.has(service.id)
                      ? `${service.name} already requested`
                      : `Request ${service.name} service`
                  }
                >
                  {isRequesting === service.id && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                  )}
                  {requestedServices.has(service.id) ? (
                    <>
                      <Check className="h-4 w-4 mr-2" aria-hidden="true" />
                      Requested
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" aria-hidden="true" />
                      Request Service
                    </>
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
