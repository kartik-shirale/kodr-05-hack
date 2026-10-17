"use client";

import React, { Suspense, useEffect } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  ShieldAlert,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";
import { useMe } from "@/features/auth/hooks/use-me";
import { useLogout } from "@/features/auth/hooks/use-logout";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function TeacherLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {

  const pathname = usePathname();
  const router = useRouter();
  const { data: user, isLoading, isError } = useMe();
  const logoutMutation = useLogout();

  useEffect(() => {
    if (!isLoading && (isError || !user || user.role !== "TEACHER")) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isError, user, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-6 bg-background">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (!user || user.role !== "TEACHER") {
    return null;
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "T";

  const getBreadcrumbs = () => {
    const parts = pathname.split("/").filter(Boolean);
    const crumbs = [];

    if (parts.length >= 1 && parts[0] === "dashboard") {
      crumbs.push({ label: "Dashboard", href: "/dashboard", isCurrent: true });
    } else if (parts[0] === "tests") {
      crumbs.push({ label: "Dashboard", href: "/dashboard", isCurrent: false });
      if (parts[1] === "new") {
        crumbs.push({ label: "New Test", href: "/tests/new", isCurrent: true });
      } else if (parts[1]) {
        crumbs.push({ label: "Test Detail", href: `/tests/${parts[1]}`, isCurrent: parts.length === 2 });
        if (parts[2] === "edit") {
          crumbs.push({ label: "Edit", href: `/tests/${parts[1]}/edit`, isCurrent: true });
        } else if (parts[2] === "sessions" && parts[3]) {
          crumbs.push({
            label: "Session Review",
            href: `/tests/${parts[1]}/sessions/${parts[3]}`,
            isCurrent: true,
          });
        }
      }
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar variant="inset" collapsible="icon">
          <SidebarHeader className="border-b border-border/50 p-4">
            <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold">
              <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                <ShieldAlert className="size-4" />
              </div>
              <div className="flex flex-col truncate">
                <span className="text-sm font-semibold leading-none">KODR Proctor</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">Teacher Portal</span>
              </div>
            </Link>
          </SidebarHeader>

          <SidebarContent className="p-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/dashboard"}
                  tooltip="Dashboard"
                  render={<Link href="/dashboard" className="flex items-center gap-2.5" />}
                >
                  <LayoutDashboard className="size-4" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/tests/new"}
                  tooltip="New Test"
                  render={<Link href="/tests/new" className="flex items-center gap-2.5" />}
                >
                  <PlusCircle className="size-4" />
                  <span>New Test</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t border-border/50 p-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <SidebarMenuButton className="h-12 w-full justify-between">
                        <div className="flex items-center gap-2 truncate">
                          <Avatar className="size-7">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col text-left truncate">
                            <span className="text-xs font-medium truncate">{user.name}</span>
                            <span className="text-[10px] text-muted-foreground truncate">
                              {user.email}
                            </span>
                          </div>
                        </div>
                        <ChevronDown className="size-3.5 text-muted-foreground" />
                      </SidebarMenuButton>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => logoutMutation.mutate()}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <LogOut className="mr-2 size-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/50 bg-background/95 backdrop-blur px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={crumb.href}>
                    {idx > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {crumb.isCurrent ? (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink render={<Link href={crumb.href} />}>
                          {crumb.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </header>


          <main className="flex-1 p-6 overflow-y-auto">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center p-6 bg-background">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      }
    >
      <TeacherLayoutContent>{children}</TeacherLayoutContent>
    </Suspense>
  );
}

