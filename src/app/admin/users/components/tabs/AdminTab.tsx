'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function AdminTab() {
  const [activeTab, setActiveTab] = useState('templates')

  // Mock data for workflow templates
  const [templates] = useState([
    {
      id: '1',
      name: 'Employee Onboarding',
      description: 'Complete onboarding workflow for new employees',
      status: 'active',
      steps: 4,
      users: 12
    },
    {
      id: '2',
      name: 'Department Change',
      description: 'Workflow for employees changing departments',
      status: 'active',
      steps: 3,
      users: 5
    },
    {
      id: '3',
      name: 'Role Promotion',
      description: 'Workflow for employee promotions and role changes',
      status: 'active',
      steps: 5,
      users: 8
    },
    {
      id: '4',
      name: 'Employee Offboarding',
      description: 'Offboarding workflow for departing employees',
      status: 'active',
      steps: 6,
      users: 3
    }
  ])

  // Mock approval routing rules
  const [rules] = useState([
    {
      id: '1',
      name: 'Manager Approval',
      trigger: 'Role Change',
      approver: 'Manager',
      required: true
    },
    {
      id: '2',
      name: 'HR Approval',
      trigger: 'Onboarding',
      approver: 'HR Team',
      required: true
    },
    {
      id: '3',
      name: 'Security Review',
      trigger: 'Permission Grant',
      approver: 'Security Admin',
      required: true
    },
    {
      id: '4',
      name: 'Budget Approval',
      trigger: 'Compensation Change',
      approver: 'Finance Manager',
      required: false
    }
  ])

  // Mock permission groups
  const [permissions] = useState([
    {
      id: '1',
      name: 'User Management',
      permissions: ['CREATE_USER', 'EDIT_USER', 'DELETE_USER', 'MANAGE_ROLES'],
      roles: ['ADMIN', 'LEAD']
    },
    {
      id: '2',
      name: 'Workflow Management',
      permissions: ['CREATE_WORKFLOW', 'EXECUTE_WORKFLOW', 'APPROVE_WORKFLOW'],
      roles: ['ADMIN', 'MANAGER']
    },
    {
      id: '3',
      name: 'Audit & Compliance',
      permissions: ['VIEW_AUDIT_LOGS', 'EXPORT_REPORTS', 'VIEW_COMPLIANCE'],
      roles: ['ADMIN', 'SUPER_ADMIN']
    },
    {
      id: '4',
      name: 'Settings Management',
      permissions: ['MANAGE_SETTINGS', 'MANAGE_INTEGRATIONS', 'CONFIGURE_SYSTEM'],
      roles: ['ADMIN']
    }
  ])

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Admin Settings</h2>
        <p className="text-gray-600 text-sm mt-1">
          Configure system behavior and manage templates
        </p>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4">
          <TabsTrigger value="templates">🎯 Templates</TabsTrigger>
          <TabsTrigger value="routing">✓ Approvals</TabsTrigger>
          <TabsTrigger value="permissions">🔐 Permissions</TabsTrigger>
          <TabsTrigger value="settings">⚙️ Settings</TabsTrigger>
        </TabsList>

        {/* Workflow Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Workflow Templates</h3>
            <Button className="bg-blue-600 hover:bg-blue-700">
              + New Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(template => (
              <Card key={template.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {template.status}
                  </Badge>
                </div>

                <div className="flex gap-4 text-sm text-gray-600 mb-4 py-3 border-t border-b">
                  <div>
                    <span className="font-medium">{template.steps}</span> steps
                  </div>
                  <div>
                    <span className="font-medium">{template.users}</span> active
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-blue-600">
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-6 bg-blue-50 border-blue-200">
            <h4 className="font-semibold mb-2">Template Tips</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>✓ Templates can be reused for multiple workflows</li>
              <li>✓ Steps are executed in order with built-in validation</li>
              <li>✓ Add approval gates to any step</li>
              <li>✓ Templates support conditional logic and branching</li>
            </ul>
          </Card>
        </TabsContent>

        {/* Approval Routing Tab */}
        <TabsContent value="routing" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Approval Routing Rules</h3>
            <Button className="bg-blue-600 hover:bg-blue-700">
              + New Rule
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Rule Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Trigger</th>
                  <th className="px-4 py-3 text-left font-semibold">Approver</th>
                  <th className="px-4 py-3 text-left font-semibold">Required</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rules.map(rule => (
                  <tr key={rule.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{rule.name}</td>
                    <td className="px-4 py-3 text-gray-600">{rule.trigger}</td>
                    <td className="px-4 py-3 text-gray-600">{rule.approver}</td>
                    <td className="px-4 py-3">
                      <Badge className={rule.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}>
                        {rule.required ? 'Required' : 'Optional'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Card className="p-6 bg-blue-50 border-blue-200">
            <h4 className="font-semibold mb-2">Routing Configuration</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>✓ Required rules must be completed before workflow proceeds</li>
              <li>✓ Optional rules are recommended but not blocking</li>
              <li>✓ Approvers receive email notifications</li>
              <li>✓ SLA tracking for approval turnaround times</li>
            </ul>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-4">Permission Matrix</h3>
            <p className="text-sm text-gray-600 mb-4">
              Define which roles have which permissions across the system
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-lg">
              <thead className="bg-gray-100">
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-semibold">Permission Group</th>
                  <th className="px-4 py-3 text-left font-semibold">Permissions</th>
                  <th className="px-4 py-3 text-left font-semibold">Assigned Roles</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map(group => (
                  <tr key={group.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{group.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {group.permissions.map(perm => (
                          <Badge key={perm} className="text-xs bg-blue-100 text-blue-800">
                            {perm.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {group.roles.map(role => (
                          <Badge key={role} className="text-xs bg-purple-100 text-purple-800">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Card className="p-6 bg-blue-50 border-blue-200">
            <h4 className="font-semibold mb-2">Permission Management</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>✓ Control granular access to all features</li>
              <li>✓ Create custom permission groups</li>
              <li>✓ Assign to multiple roles</li>
              <li>✓ Changes take effect immediately</li>
            </ul>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <h3 className="text-lg font-semibold">System Settings</h3>

          <div className="space-y-4">
            {/* Audit Settings */}
            <Card className="p-6">
              <h4 className="font-semibold mb-4">Audit & Logging</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">Audit Log Retention</p>
                    <p className="text-sm text-gray-600">How long to keep audit logs</p>
                  </div>
                  <select className="px-3 py-2 border border-gray-300 rounded text-sm">
                    <option>30 days</option>
                    <option>60 days</option>
                    <option>90 days</option>
                    <option>1 year</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-600">Send alerts for sensitive operations</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">Detailed Logging</p>
                    <p className="text-sm text-gray-600">Log all operation details</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                </div>
              </div>
            </Card>

            {/* Integration Settings */}
            <Card className="p-6">
              <h4 className="font-semibold mb-4">Integrations</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">Webhook Notifications</p>
                    <p className="text-sm text-gray-600">Send workflow events to external systems</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">Email Service</p>
                    <p className="text-sm text-gray-600">SendGrid (Connected)</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Reconnect
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">Zapier Integration</p>
                    <p className="text-sm text-gray-600">Not connected</p>
                  </div>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Connect
                  </Button>
                </div>
              </div>
            </Card>

            {/* Performance Settings */}
            <Card className="p-6">
              <h4 className="font-semibold mb-4">Performance</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">Batch Size</p>
                    <p className="text-sm text-gray-600">Users per batch operation</p>
                  </div>
                  <input
                    type="number"
                    defaultValue="500"
                    className="px-3 py-2 border border-gray-300 rounded text-sm w-20"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">Cache Duration</p>
                    <p className="text-sm text-gray-600">Data cache expiry (minutes)</p>
                  </div>
                  <input
                    type="number"
                    defaultValue="15"
                    className="px-3 py-2 border border-gray-300 rounded text-sm w-20"
                  />
                </div>
              </div>
            </Card>
          </div>

          <Button className="bg-green-600 hover:bg-green-700">
            💾 Save Settings
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  )
}
