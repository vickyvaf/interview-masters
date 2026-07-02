import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Box, Flex, Text, Button, SegmentedControl } from "@radix-ui/themes";
import {
  DashboardIcon,
  PlayIcon,
  ActivityLogIcon,
  CardStackIcon,
  GearIcon,
  PersonIcon,
  SunIcon,
  MoonIcon,
  LaptopIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";
import { useDashboardTheme } from "./ThemeProvider";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface SidebarItemProps {
  label: string;
  path: string;
  icon: React.ReactNode;
  isActive: boolean;
  isCollapsed?: boolean;
}

function SidebarItem({
  label,
  path,
  icon,
  isActive,
  isCollapsed,
}: SidebarItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      to={path}
      style={{
        textDecoration: "none",
        width: "100%",
        display: "block",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: isCollapsed ? "center" : "flex-start",
          width: "100%",
          height: "40px",
          cursor: "pointer",
          padding: 0,
          margin: 0,
          border: "none",
          outline: "none",
          borderRadius: "0",
          backgroundColor: isActive
            ? "var(--accent-9)"
            : isHovered
              ? "var(--gray-a3)"
              : "transparent",
          color: isActive
            ? "#ffffff"
            : isHovered
              ? "var(--gray-12)"
              : "var(--gray-11)",
          transition: "background-color 0.15s, color 0.15s",
        }}
      >
        {isCollapsed ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
            }}
          >
            {icon}
          </span>
        ) : (
          <Flex
            gap="3"
            align="center"
            style={{
              width: "100%",
              padding: "0 24px",
              boxSizing: "border-box",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                color: "inherit",
                flexShrink: 0,
              }}
            >
              {icon}
            </span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: isActive ? 500 : 400,
                color: "inherit",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {label}
            </span>
          </Flex>
        )}
      </button>
    </Link>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const { theme, setTheme } = useDashboardTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { label: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
    { label: "Mulai Interview", path: "/playground", icon: <PlayIcon /> },
    {
      label: "Riwayat & Evaluasi",
      path: "/history",
      icon: <ActivityLogIcon />,
    },
    { label: "Billing & Langganan", path: "/billing", icon: <CardStackIcon /> },
    { label: "Organisasi", path: "/organization", icon: <PersonIcon /> },
  ];

  const bottomItems = [
    { label: "Pengaturan", path: "/settings", icon: <GearIcon /> },
  ];

  return (
    <Flex style={{ height: "100vh", width: "100vw", overflow: "hidden" }}>
      {/* Sidebar */}
      <Box
        style={{
          width: isCollapsed ? "64px" : "260px",
          flexShrink: 0,
          borderRight: "1px solid var(--gray-4)",
          backgroundColor: "var(--gray-2)",
          padding: "24px 0",
          boxSizing: "border-box",
          transition: "width 0.2s ease",
          position: "relative",
        }}
      >
        {/* Toggle Button in the top-right edge of the sidebar, aligned with the logo */}
        <Button
          variant="soft"
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            position: "absolute",
            right: "-12px",
            top: "38px",
            transform: "translateY(-50%)",
            zIndex: 10,
            cursor: "pointer",
            width: "24px",
            height: "24px",
            minWidth: "auto",
            borderRadius: "50%",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
            border: "1px solid var(--gray-5)",
            backgroundColor: "var(--gray-1)",
            color: "var(--gray-12)",
          }}
        >
          {isCollapsed ? (
            <ChevronRightIcon width="14" height="14" />
          ) : (
            <ChevronLeftIcon width="14" height="14" />
          )}
        </Button>

        <Flex
          direction="column"
          gap="6"
          style={{ height: "100%", width: "100%" }}
        >
          {/* Logo & Brand */}
          <Flex
            align="center"
            justify={isCollapsed ? "center" : "start"}
            style={{
              padding: isCollapsed ? "0" : "0 24px",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src="/logo.png"
                alt="Interview Masters"
                style={{ width: "28px", height: "28px" }}
              />
            </span>
            {!isCollapsed && (
              <Text size="3" weight="bold" style={{ marginLeft: "12px" }}>
                {/*Interview Masters*/}
              </Text>
            )}
          </Flex>

          {/* Navigation Links */}
          <Flex
            direction="column"
            gap="1"
            style={{ width: "100%", flexGrow: 1 }}
          >
            {menuItems.map((item) => (
              <SidebarItem
                key={item.path}
                label={item.label}
                path={item.path}
                icon={item.icon}
                isActive={location.pathname === item.path}
                isCollapsed={isCollapsed}
              />
            ))}
          </Flex>

          {/* Footer Area: Settings & Theme Toggle */}
          <Flex direction="column" gap="4">
            {/* Settings Link */}
            <Flex direction="column" gap="1" style={{ width: "100%" }}>
              {bottomItems.map((item) => (
                <SidebarItem
                  key={item.path}
                  label={item.label}
                  path={item.path}
                  icon={item.icon}
                  isActive={location.pathname === item.path}
                  isCollapsed={isCollapsed}
                />
              ))}
            </Flex>

            {/* Theme Toggle */}
            <Box
              style={{
                padding: isCollapsed ? "0" : "0 24px",
                display: "flex",
                justifyContent: "center",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              {isCollapsed ? (
                <Button
                  variant="ghost"
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  style={{
                    width: "100%",
                    height: "40px",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: 0,
                    borderRadius: "0",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {theme === "light" ? (
                      <SunIcon width="16" height="16" />
                    ) : theme === "dark" ? (
                      <MoonIcon width="16" height="16" />
                    ) : (
                      <LaptopIcon width="16" height="16" />
                    )}
                  </span>
                </Button>
              ) : (
                <SegmentedControl.Root
                  value={theme}
                  onValueChange={(val) => setTheme(val as any)}
                  style={{ width: "100%" }}
                >
                  <SegmentedControl.Item value="light" title="Light Theme">
                    <Flex align="center" justify="center">
                      <SunIcon width="16" height="16" />
                    </Flex>
                  </SegmentedControl.Item>
                  <SegmentedControl.Item value="dark" title="Dark Theme">
                    <Flex align="center" justify="center">
                      <MoonIcon width="16" height="16" />
                    </Flex>
                  </SegmentedControl.Item>
                  <SegmentedControl.Item
                    value="system"
                    title="System / Device Theme"
                  >
                    <Flex align="center" justify="center">
                      <LaptopIcon width="16" height="16" />
                    </Flex>
                  </SegmentedControl.Item>
                </SegmentedControl.Root>
              )}
            </Box>
          </Flex>
        </Flex>
      </Box>

      {/* Main Content Area */}
      <Box
        style={{
          flexGrow: 1,
          height: "100%",
          overflowY: "auto",
          backgroundColor: "var(--gray-1)",
        }}
      >
        {children}
      </Box>
    </Flex>
  );
}
