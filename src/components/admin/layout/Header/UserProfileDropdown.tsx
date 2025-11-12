"use client"

import { useMemo, type Ref, memo, type ReactNode } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { ChevronDown, User as UserIcon, Settings, LogOut, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import Avatar from "./UserProfileDropdown/Avatar"
import UserInfo from "./UserProfileDropdown/UserInfo"
import { ThemeSelector } from "./UserProfileDropdown/ThemeSelector"
import { StatusSelector } from "./UserProfileDropdown/StatusSelector"
import type { UserMenuLink } from "./UserProfileDropdown/types"
import { MENU_LINKS, HELP_LINKS } from "./UserProfileDropdown/constants"
import { useUserStatus } from "@/hooks/useUserStatus"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"

export interface UserProfileDropdownProps {
  className?: string
  showStatus?: boolean
  onSignOut?: () => Promise<void> | void
  onOpenProfilePanel?: () => void
  triggerRef?: Ref<HTMLButtonElement>
  customLinks?: UserMenuLink[]
}

interface MenuSectionProps {
  title?: string
  children: ReactNode
  className?: string
}

/**
 * MenuSection - Helper component for organizing dropdown menu items into sections
 * Provides visual grouping with headers and separators
 */
function MenuSection({ title, children, className }: MenuSectionProps) {
  return (
    <>
      {title && (
        <div className={cn("px-3 py-2", className)}>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {title}
          </span>
        </div>
      )}
      <div className={cn("space-y-1", !title && "py-1")}>
        {children}
      </div>
      <DropdownMenuSeparator />
    </>
  )
}

interface MenuItemProps {
  href: string
  label: string
  icon?: typeof UserIcon
  shortcut?: string
  external?: boolean
  onClick?: () => void
  role?: string
  variant?: "default" | "danger"
}

/**
 * MenuItem - Standardized menu item with icon, label, and optional keyboard shortcut
 */
function MenuItem({
  href,
  label,
  icon: Icon,
  shortcut,
  external = false,
  onClick,
  variant = "default"
}: MenuItemProps) {
  const commonClasses = cn(
    "flex items-center justify-between gap-3 w-full px-3 py-2.5 text-sm",
    "rounded-md transition-all duration-150 ease-in-out focus-visible:outline-none",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-background",
    "group",
    variant === "danger"
      ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
      : "text-foreground hover:bg-accent dark:hover:bg-accent/50"
  )

  const content = (
    <>
      <div className="flex items-center gap-3">
        {Icon && (
          <Icon className="h-4 w-4 flex-shrink-0 transition-transform duration-150 ease-out group-hover:animate-icon-translate" />
        )}
        <span>{label}</span>
      </div>
      {shortcut && (
        <span className="text-xs text-muted-foreground font-mono opacity-75 group-hover:opacity-100 transition-opacity duration-150">
          {shortcut}
        </span>
      )}
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(commonClasses, "text-left")}
        role="menuitem"
      >
        {content}
      </button>
    )
  }

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={commonClasses}
      role="menuitem"
    >
      {content}
    </a>
  )
}

function UserProfileDropdownComponent({
  className,
  showStatus = true,
  onSignOut,
  onOpenProfilePanel,
  triggerRef,
  customLinks,
}: UserProfileDropdownProps) {
  const { data: session } = useSession()
  const name = session?.user?.name || "User"
  const email = session?.user?.email || undefined
  const image = (session?.user as any)?.image as string | undefined
  const role = (session?.user as any)?.role as string | undefined
  const organization = (session?.user as any)?.organization as string | undefined

  const links = useMemo<UserMenuLink[]>(() => {
    const raw = customLinks && customLinks.length ? customLinks : MENU_LINKS
    const roleStr = role || undefined
    return raw.filter(l => {
      if (!l.permission) return true
      const perms = Array.isArray(l.permission) ? l.permission : [l.permission]
      try { return perms.some((p:any) => hasPermission(roleStr, p)) } catch { return true }
    })
  }, [customLinks, role])

  const { status: userStatus } = useUserStatus()

  const router = useRouter()
  const { setTheme } = useTheme()

  const handleSignOut = () => {
    if (!onSignOut) return
    const ok = typeof window !== 'undefined'
      ? window.confirm('Are you sure you want to sign out?')
      : true
    if (ok) onSignOut()
  }

  // Keyboard shortcuts
  useKeyboardShortcuts([
    // Open profile (⌘P / Ctrl+P)
    { key: 'p', meta: true, handler: () => { try { onOpenProfilePanel?.() } catch {} } },
    { key: 'p', ctrl: true, handler: () => { try { onOpenProfilePanel?.() } catch {} } },

    // Settings (⌘S / Ctrl+S) → admin settings
    { key: 's', meta: true, handler: () => router.push('/admin/settings') },
    { key: 's', ctrl: true, handler: () => router.push('/admin/settings') },

    // Help (⌘? / Ctrl+Shift+?) — treat as Shift+/ key
    { key: '/', meta: true, shift: true, handler: () => router.push('/faq') },
    { key: '?', meta: true, shift: true, handler: () => router.push('/faq') },
    { key: '/', ctrl: true, shift: true, handler: () => router.push('/faq') },
    { key: '?', ctrl: true, shift: true, handler: () => router.push('/faq') },

    // Sign out (⌘Q / Ctrl+Q)
    { key: 'q', meta: true, handler: () => handleSignOut() },
    { key: 'q', ctrl: true, handler: () => handleSignOut() },

    // Theme shortcuts (⌘⇧L / ⌘⇧D) and Ctrl equivalents
    { key: 'l', meta: true, shift: true, handler: () => setTheme('light') as unknown as void },
    { key: 'l', ctrl: true, shift: true, handler: () => setTheme('light') as unknown as void },
    { key: 'd', meta: true, shift: true, handler: () => setTheme('dark') as unknown as void },
    { key: 'd', ctrl: true, shift: true, handler: () => setTheme('dark') as unknown as void },
  ])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          ref={triggerRef as any}
          variant="ghost"
          className={cn("flex items-center gap-2 px-3", className)}
          aria-label="Open user menu"
        >
          <div className="relative h-8 w-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
            {image ? (
              <img src={image} alt={name} className="h-full w-full object-cover" />
            ) : (
              <UserIcon className="h-4 w-4 text-gray-600" />
            )}
            {showStatus && (
              <span
                aria-hidden
                className={cn(
                  "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white",
                  userStatus === "online" && "bg-green-500",
                  userStatus === "away" && "bg-amber-400",
                  userStatus === "busy" && "bg-red-500"
                )}
              />
            )}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-sm font-medium text-gray-900">{name}</div>
            <div className="text-xs text-gray-500">{role || ""}</div>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80" data-testid="user-profile-dropdown">
        {/* Profile Section */}
        <div className="p-3 pb-2">
          <div className="flex items-center gap-3">
            <Avatar
              name={name}
              src={image}
              size="md"
              showStatus={showStatus}
              status={userStatus}
            />
            <UserInfo
              name={name}
              email={email}
              role={role}
              organization={organization}
              variant="full"
            />
          </div>
        </div>

        {/* Preferences Section (Theme & Status) */}
        <MenuSection title="Preferences">
          <div className="space-y-2 px-2 py-1">
            <ThemeSelector showLabels={false} className="justify-between px-1" />
            {showStatus && <StatusSelector />}
          </div>
        </MenuSection>

        {/* Admin Section - Show only to users with admin permissions */}
        {(hasPermission(role, PERMISSIONS.ANALYTICS_VIEW) ||
          hasPermission(role, PERMISSIONS.USERS_MANAGE) ||
          hasPermission(role, PERMISSIONS.SYSTEM_ADMIN_SETTINGS_VIEW)) && (
          <MenuSection title="Administration">
            <MenuItem
              href="/admin"
              label="Admin Dashboard"
              icon={LayoutDashboard}
            />
          </MenuSection>
        )}

        {/* Profile Actions Section */}
        <MenuSection title="Profile">
          {onOpenProfilePanel && (
            <MenuItem
              href="#"
              label="Manage Profile"
              icon={UserIcon}
              shortcut="⌘P"
              onClick={onOpenProfilePanel}
            />
          )}
          <MenuItem
            href="/admin/settings"
            label="Settings"
            icon={Settings}
          />
        </MenuSection>

        {/* Quick Actions Section */}
        <MenuSection title="Quick Actions">
          {links.map((link) => (
            <MenuItem
              key={link.href}
              href={link.href}
              label={link.label}
              icon={link.icon}
              external={link.external}
            />
          ))}
          {HELP_LINKS.map((link) => (
            <MenuItem
              key={link.href}
              href={link.href}
              label={link.label}
              icon={link.icon}
              shortcut={link.label === "Help" ? "⌘?" : undefined}
              external={link.external}
            />
          ))}
        </MenuSection>

        {/* Sign Out Section */}
        <div className="py-1">
          <MenuItem
            href="#"
            label="Sign Out"
            icon={LogOut}
            shortcut="⌘Q"
            onClick={handleSignOut}
            variant="danger"
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default memo(UserProfileDropdownComponent)
