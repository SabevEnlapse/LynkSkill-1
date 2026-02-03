"use client"

import { Badge } from "@/components/ui/badge"
import { Crown, Shield, User, Eye, Briefcase } from "lucide-react"

interface RoleBadgeProps {
  defaultRole: string | null
  customRole: {
    id: string
    name: string
    color: string | null
  } | null
}

const ROLE_CONFIG: Record<string, {
  label: string
  icon: React.ComponentType<{ className?: string }>
  className: string
}> = {
  OWNER: {
    label: "Owner",
    icon: Crown,
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 border-purple-300 dark:border-purple-700",
  },
  ADMIN: {
    label: "Admin",
    icon: Shield,
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-700",
  },
  HR_MANAGER: {
    label: "HR Manager",
    icon: Briefcase,
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-300 dark:border-green-700",
  },
  HR_RECRUITER: {
    label: "HR Recruiter",
    icon: User,
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700",
  },
  VIEWER: {
    label: "Viewer",
    icon: Eye,
    className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600",
  },
}

export function RoleBadge({ defaultRole, customRole }: RoleBadgeProps) {
  if (customRole) {
    return (
      <Badge
        variant="outline"
        className="flex items-center gap-1"
        style={{
          backgroundColor: customRole.color ? `${customRole.color}20` : undefined,
          borderColor: customRole.color || undefined,
          color: customRole.color || undefined,
        }}
      >
        <Shield className="h-3 w-3" />
        {customRole.name}
      </Badge>
    )
  }

  if (defaultRole && ROLE_CONFIG[defaultRole]) {
    const config = ROLE_CONFIG[defaultRole]
    const Icon = config.icon

    return (
      <Badge variant="outline" className={`flex items-center gap-1 ${config.className}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  return (
    <Badge variant="secondary">
      Unknown Role
    </Badge>
  )
}
