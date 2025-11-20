import { z } from 'zod'

const EmailTemplateSchema = z.object({
  key: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  subject: z.string().min(1).max(240),
  body: z.string().max(20000).default(''),
  enabled: z.boolean().default(true),
})

export const CommunicationEmailSchema = z.object({
  senderName: z.string().min(1).max(120).default(''),
  senderEmail: z.string().email().default(''),
  replyTo: z.string().email().or(z.literal('')).default(''),
  signatureHtml: z.string().max(12000).default(''),
  transactionalEnabled: z.boolean().default(true),
  marketingEnabled: z.boolean().default(false),
  complianceBcc: z.boolean().default(false),
  templates: z.array(EmailTemplateSchema).max(50).default([]),
})

const SmsRouteSchema = z.object({
  key: z.string().min(1).max(120),
  destination: z.string().min(1).max(20),
})

export const CommunicationSmsSchema = z.object({
  provider: z.enum(['none', 'twilio', 'plivo', 'nexmo', 'messageBird']).default('none'),
  senderId: z.string().max(20).default(''),
  transactionalEnabled: z.boolean().default(false),
  marketingEnabled: z.boolean().default(false),
  fallbackToEmail: z.boolean().default(true),
  routes: z.array(SmsRouteSchema).max(20).default([]),
})

export const CommunicationChatSchema = z.object({
  enabled: z.boolean().default(false),
  provider: z.enum(['none', 'intercom', 'drift', 'zendesk', 'liveChat']).default('none'),
  routing: z.enum(['roundRobin', 'leastBusy', 'firstAvailable', 'manual']).default('roundRobin'),
  offlineMessage: z.string().max(2000).default(''),
  workingHours: z.object({
    timezone: z.string().default('UTC'),
    start: z.string().regex(/^\d{2}:\d{2}$/).default('09:00'),
    end: z.string().regex(/^\d{2}:\d{2}$/).default('17:00'),
  }).default({
    timezone: 'UTC',
    start: '09:00',
    end: '17:00',
  }),
  escalationEmails: z.array(z.string().email()).max(20).default([]),
})

const NotificationPreferenceSchema = z.object({
  channel: z.enum(['bookings', 'invoices', 'tasks', 'deadlines', 'compliance', 'system']).default('bookings'),
  email: z.boolean().default(true),
  sms: z.boolean().default(false),
  inApp: z.boolean().default(true),
  push: z.boolean().default(false),
  digest: z.enum(['immediate', 'hourly', 'daily', 'weekly']).default('immediate'),
})

export const CommunicationNotificationsSchema = z.object({
  preferences: z.array(NotificationPreferenceSchema).max(50).default([]),
  digestTime: z.string().regex(/^\d{2}:\d{2}$/).default('08:00'),
  timezone: z.string().default('UTC'),
})

const NewsletterTopicSchema = z.object({
  key: z.string().min(1).max(100),
  label: z.string().min(1).max(120),
  description: z.string().max(500).default(''),
})

export const CommunicationNewslettersSchema = z.object({
  enabled: z.boolean().default(false),
  doubleOptIn: z.boolean().default(true),
  defaultSenderName: z.string().max(120).default(''),
  defaultSenderEmail: z.string().email().default(''),
  archiveUrl: z.string().url().default(''),
  topics: z.array(NewsletterTopicSchema).max(25).default([]),
})

const ReminderChannelSchema = z.enum(['email', 'sms', 'push'])

const ReminderConfigSchema = z.object({
  enabled: z.boolean().default(true),
  offsetHours: z.number().min(0).max(720).default(24),
  channels: z.array(ReminderChannelSchema).min(1).max(3).default(['email']),
  templateId: z.string().max(120).default(''),
})

export const CommunicationRemindersSchema = z.object({
  bookings: ReminderConfigSchema.default({
    enabled: true,
    offsetHours: 24,
    channels: ['email'],
    templateId: '',
  }),
  invoices: ReminderConfigSchema.default({
    enabled: true,
    offsetHours: 72,
    channels: ['email'],
    templateId: '',
  }),
  tasks: ReminderConfigSchema.default({
    enabled: false,
    offsetHours: 12,
    channels: ['email'],
    templateId: '',
  }),
})

export const CommunicationSettingsSchema = z.object({
  email: CommunicationEmailSchema.default({
    senderName: '',
    senderEmail: '',
    replyTo: '',
    signatureHtml: '',
    transactionalEnabled: true,
    marketingEnabled: false,
    complianceBcc: false,
    templates: [],
  }),
  sms: CommunicationSmsSchema.default({
    provider: 'none',
    senderId: '',
    transactionalEnabled: false,
    marketingEnabled: false,
    fallbackToEmail: true,
    routes: [],
  }),
  chat: CommunicationChatSchema.default({
    enabled: false,
    provider: 'none',
    routing: 'roundRobin',
    offlineMessage: '',
    workingHours: {
      timezone: 'UTC',
      start: '09:00',
      end: '17:00',
    },
    escalationEmails: [],
  }),
  notifications: CommunicationNotificationsSchema.default({
    preferences: [],
    digestTime: '08:00',
    timezone: 'UTC',
  }),
  newsletters: CommunicationNewslettersSchema.default({
    enabled: false,
    doubleOptIn: true,
    defaultSenderName: '',
    defaultSenderEmail: '',
    archiveUrl: '',
    topics: [],
  }),
  reminders: CommunicationRemindersSchema.default({
    bookings: {
      enabled: true,
      offsetHours: 24,
      channels: ['email'],
      templateId: '',
    },
    invoices: {
      enabled: true,
      offsetHours: 72,
      channels: ['email'],
      templateId: '',
    },
    tasks: {
      enabled: false,
      offsetHours: 12,
      channels: ['email'],
      templateId: '',
    },
  }),
})

export const CommunicationSettingsPatchSchema = z
  .object({
    email: CommunicationEmailSchema.partial().optional(),
    sms: CommunicationSmsSchema.partial().optional(),
    chat: CommunicationChatSchema.partial().optional(),
    notifications: CommunicationNotificationsSchema.partial().optional(),
    newsletters: CommunicationNewslettersSchema.partial().optional(),
    reminders: z
      .object({
        bookings: ReminderConfigSchema.partial().optional(),
        invoices: ReminderConfigSchema.partial().optional(),
        tasks: ReminderConfigSchema.partial().optional(),
      })
      .optional(),
  })
  .partial()

export type CommunicationEmailSettings = z.infer<typeof CommunicationEmailSchema>
export type CommunicationSmsSettings = z.infer<typeof CommunicationSmsSchema>
export type CommunicationChatSettings = z.infer<typeof CommunicationChatSchema>
export type CommunicationNotificationsSettings = z.infer<typeof CommunicationNotificationsSchema>
export type CommunicationNewslettersSettings = z.infer<typeof CommunicationNewslettersSchema>
export type CommunicationRemindersSettings = z.infer<typeof CommunicationRemindersSchema>
export type CommunicationSettings = z.infer<typeof CommunicationSettingsSchema>
export type CommunicationSettingsPatch = z.infer<typeof CommunicationSettingsPatchSchema>
