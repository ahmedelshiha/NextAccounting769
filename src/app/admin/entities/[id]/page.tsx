"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Entity {
  id: string;
  name: string;
  country: string;
  legalForm?: string;
  status: string;
  activityCode?: string;
  fiscalYearStart?: string;
  registrationCertUrl?: string;
  registrationCertHash?: string;
  createdAt: string;
  updatedAt: string;
  licenses?: Array<{
    id: string;
    licenseNumber: string;
    authority: string;
    status: string;
    expiresAt?: string;
  }>;
  registrations?: Array<{
    id: string;
    type: string;
    value: string;
    status: string;
    verifiedAt?: string;
  }>;
  obligations?: Array<{
    id: string;
    type: string;
    frequency: string;
    active: boolean;
  }>;
}

const updateEntitySchema = z.object({
  name: z.string().min(1, "Business name is required").max(255),
  legalForm: z.string().optional(),
  status: z.enum(["ACTIVE", "PENDING", "ARCHIVED", "SUSPENDED"]),
  activityCode: z.string().optional(),
});

type UpdateEntityInput = z.infer<typeof updateEntitySchema>;

export default function EntityDetailPage() {
  const router = useRouter();
  const params = useParams() as { id?: string };
  const id = params?.id;

  const [entity, setEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    setValue,
  } = useForm<UpdateEntityInput>({
    resolver: zodResolver(updateEntitySchema),
  });

  const currentStatus = watch("status");

  // Fetch entity details
  useEffect(() => {
    if (!id) return;

    const fetchEntity = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/entities/${id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch entity");
        }

        const result = await response.json();
        const entityData = result.data;
        setEntity(entityData);

        // Initialize form with entity data
        reset({
          name: entityData.name,
          legalForm: entityData.legalForm || "",
          status: entityData.status,
          activityCode: entityData.activityCode || "",
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load entity");
      } finally {
        setLoading(false);
      }
    };

    fetchEntity();
  }, [id, reset]);

  const onSubmit = async (data: UpdateEntityInput) => {
    if (!id) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/entities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update entity");
      }

      const result = await response.json();
      setEntity(result.data);
      setEditMode(false);
      toast.success("Entity updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update entity");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (permanent: boolean = false) => {
    if (!id) return;

    try {
      setSaving(true);
      const url = permanent ? `/api/entities/${id}?permanent=true` : `/api/entities/${id}`;
      const response = await fetch(url, { method: "DELETE" });

      if (!response.ok) {
        throw new Error("Failed to delete entity");
      }

      toast.success(permanent ? "Entity permanently deleted" : "Entity archived");
      router.push("/admin/entities");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete entity");
    } finally {
      setSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Entity not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const countryMap: Record<string, { name: string; flag: string }> = {
    AE: { name: "UAE", flag: "🇦🇪" },
    SA: { name: "Saudi Arabia", flag: "🇸🇦" },
    EG: { name: "Egypt", flag: "🇪🇬" },
  };

  const country = countryMap[entity.country];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/entities">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Entities
          </Button>
        </Link>
      </div>

      {/* Title and Status */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{country?.flag}</span>
            <h1 className="text-3xl font-bold text-gray-900">{entity.name}</h1>
          </div>
          <p className="text-gray-600">{country?.name}</p>
        </div>
        <div className="flex gap-2">
          {!editMode && (
            <>
              <Button onClick={() => setEditMode(true)} variant="outline">
                Edit
              </Button>
              <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status and Key Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Status</div>
            <div className="flex items-center gap-2">
              {entity.status === "ACTIVE" ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              <span className="font-medium">{entity.status}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Legal Form</div>
            <div className="font-medium">{entity.legalForm || "—"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Created</div>
            <div className="font-medium text-sm">
              {new Date(entity.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Updated</div>
            <div className="font-medium text-sm">
              {new Date(entity.updatedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Form */}
      {editMode && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg">Edit Entity Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Business Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <Input
                  {...register("name")}
                  placeholder="Enter business name"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* Legal Form */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Legal Form
                </label>
                <Input
                  {...register("legalForm")}
                  placeholder="e.g., LLC, Sole Establishment, Corporation"
                />
              </div>

              {/* Activity Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Code
                </label>
                <Input
                  {...register("activityCode")}
                  placeholder="e.g., 6201 (Professional Services)"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <Select value={currentStatus} onValueChange={(value) => setValue("status", value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={saving || !isDirty}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditMode(false);
                    reset();
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Licenses Tab */}
      <Tabs defaultValue="registrations">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
          <TabsTrigger value="licenses">Licenses</TabsTrigger>
          <TabsTrigger value="obligations">Obligations</TabsTrigger>
        </TabsList>

        {/* Registrations */}
        <TabsContent value="registrations">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tax Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              {entity.registrations && entity.registrations.length > 0 ? (
                <div className="space-y-4">
                  {entity.registrations.map((reg) => (
                    <div
                      key={reg.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{reg.type}</div>
                        <div className="text-sm text-gray-600 mt-1">{reg.value}</div>
                        {reg.verifiedAt && (
                          <div className="text-xs text-green-600 mt-1">
                            ✓ Verified {new Date(reg.verifiedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block px-3 py-1 rounded text-xs font-medium ${
                            reg.status === "VERIFIED"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {reg.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">No registrations found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Licenses */}
        <TabsContent value="licenses">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Business Licenses</CardTitle>
            </CardHeader>
            <CardContent>
              {entity.licenses && entity.licenses.length > 0 ? (
                <div className="space-y-4">
                  {entity.licenses.map((license) => (
                    <div
                      key={license.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{license.authority}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          License #: {license.licenseNumber}
                        </div>
                        {license.expiresAt && (
                          <div className="text-xs text-gray-600 mt-1">
                            Expires: {new Date(license.expiresAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block px-3 py-1 rounded text-xs font-medium ${
                            license.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {license.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">No licenses found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Obligations */}
        <TabsContent value="obligations">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tax Obligations</CardTitle>
            </CardHeader>
            <CardContent>
              {entity.obligations && entity.obligations.length > 0 ? (
                <div className="space-y-4">
                  {entity.obligations.map((obligation) => (
                    <div
                      key={obligation.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{obligation.type}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Frequency: {obligation.frequency}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block px-3 py-1 rounded text-xs font-medium ${
                            obligation.active
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {obligation.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">No obligations found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="text-lg">Delete Entity?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                This will archive the entity. You can permanently delete it later if needed.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(false)}
                  disabled={saving}
                >
                  {saving ? "Archiving..." : "Archive"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
