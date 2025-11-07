"use client"

import React, { memo, type Ref } from "react"
import { ChevronDown, LogOut, Settings, Shield, User as UserIcon } from "lucide-react"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Avatar from "./UserProfileDropdown/Avatar"
import UserInfo from "./UserProfileDropdown/UserInfo"
import { ThemeSelector } from "./UserProfileDropdown/ThemeSelector"
import { StatusSelector } from "./UserProfileDropdown/StatusSelector"
import type { UserMenuLink } from "./UserProfileDropdown/types"
import { MENU_LINKS, HELP_LINKS } from "./UserProfileDropdown/constants"
import { useUserStatus } from "@/hooks/useUserStatus"

export interface MobileUserMenuProps {
  className?: string
  showStatus?: boolean
  onSignOut?: () => Promise<void> | void
  onOpenProfilePanel?: () => void
  triggerRef?: Ref<HTMLButtonElement>
  customLinks?: UserMenuLink[]
}

function MobileUserMenuComponent({
  className,
  showStatus = true,
  onSignOut,
  onOpenProfilePanel,
  triggerRef,
  customLinks
}: MobileUserMenuProps) {
  const { data: session } = useSession()
  const name = session?.user?.name || "User"
  const email = session?.user?.email || undefined
  const image = (session?.user as any)?.image as string | undefined
  const role = (session?.user as any)?.role as string | undefined
  const organization = (session?.user as any)?.organization as string | undefined
  const { status: userStatus } = useUserStatus()

  const handleSignOut = () => {
    if (!onSignOut) return
    const ok = typeof window !== "undefined" ? window.confirm("Are you sure you want to sign out?") : true
    if (ok) onSignOut()
  }

  const [open, setOpen] = React.useState(false)
  const touchStartRef = React.useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return
    const currentY = e.touches[0].clientY
    const delta = currentY - touchStartRef.current
    // if user swipes down fast enough close early
    if (delta > 100) {
      setOpen(false)
      touchStartRef.current = null
    }
  }

  const handleTouchEnd = () => {
    touchStartRef.current = null
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          ref={triggerRef as any}
          aria-label="Open user menu"
          className={cn(
            "inline-flex items-center gap-2 px-3 py-2 rounded-full bg-transparent",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            className
          )}
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
          <span className="text-sm font-medium hidden sm:inline">{name}</span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>
      </SheetTrigger>
      <SheetContent className="animate-sheet-enter">
        <div className="space-y-4 p-4" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
          {/* Header */}
          <div className="flex items-center gap-3">
            <Avatar name={name} src={image} size="md" showStatus={showStatus} status={userStatus} />
            <UserInfo
              name={name}
              email={email}
              role={role}
              organization={organization}
              variant="full"
            />
          </div>

          {/* Preferences */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Preferences</h3>
            <ThemeSelector showLabels className="px-0" />
            {showStatus && <StatusSelector />}
          </div>

          {/* Profile */}
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Profile</h3>
            {onOpenProfilePanel && (
              <button
                type="button"
                onClick={() => { setOpen(false); onOpenProfilePanel() }}
                className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-accent transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group"
                role="menuitem"
              >
                <span className="flex items-center gap-3">
                  <UserIcon className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                  Manage Profile
                </span>
                <span className="text-xs text-muted-foreground">⌘P</span>
              </button>
            )}
            <a href="/settings/security" className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-accent transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group" role="menuitem">
              <span className="flex items-center gap-3">
                <Shield className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                Security Settings
              </span>
              <span className="text-xs text-muted-foreground">⌘S</span>
            </a>
            <a href="/settings" className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-accent transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group" role="menuitem">
              <span className="flex items-center gap-3">
                <Settings className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                Settings
              </span>
            </a>
          </div>

          {/* Quick Actions */}
          {(customLinks?.length || MENU_LINKS.length || HELP_LINKS.length) ? (
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quick Actions</h3>
              {(customLinks && customLinks.length ? customLinks : MENU_LINKS).map((link) => (
                <a key={link.href} href={link.href} className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-accent transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group" role="menuitem" target={link.external ? "_blank" : undefined} rel={link.external ? "noreferrer" : undefined}>
                  <span className="flex items-center gap-3">
                    {link.icon ? <link.icon className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" /> : null}
                    {link.label}
                  </span>
                </a>
              ))}
              {HELP_LINKS.map((link) => (
                <a key={link.href} href={link.href} className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-accent transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group" role="menuitem" target={link.external ? "_blank" : undefined} rel={link.external ? "noreferrer" : undefined}>
                  <span className="flex items-center gap-3">
                    {link.icon ? <link.icon className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" /> : null}
                    {link.label}
                  </span>
                  {link.label === "Help" ? (
                    <span className="text-xs text-muted-foreground">⌘?</span>
                  ) : null}
                </a>
              ))}
            </div>
          ) : null}

          {/* Sign out */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => { setOpen(false); handleSignOut() }}
              className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group"
              role="menuitem"
            >
              <span className="flex items-center gap-3">
                <LogOut className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                Sign Out
              </span>
              <span className="text-xs">⌘Q</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default memo(MobileUserMenuComponent)
