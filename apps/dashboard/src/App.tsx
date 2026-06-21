import { Authenticated, Refine } from "@refinedev/core";
import {
  ErrorComponent,
  ThemedLayout,
  ThemedTitle,
  useNotificationProvider,
} from "@refinedev/antd";
import routerProvider, {
  CatchAllNavigate,
  NavigateToResource,
} from "@refinedev/react-router";
import { App as AntdApp, ConfigProvider, theme } from "antd";
import { ThemeProvider, useTheme } from "next-themes";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import "@refinedev/antd/dist/reset.css";

import "./i18n";
import { authProvider } from "./auth-provider";
import { Header } from "./components/header";
import { dataProvider, liveProvider, restDataProvider } from "./data-provider";
import { useI18nProvider } from "./i18n-provider";
import { ItemsCreate } from "./pages/items/create";
import { ItemsEdit } from "./pages/items/edit";
import { ItemsList } from "./pages/items/list";
import { LoginPage } from "./pages/login";
import { AcceptInvitePage } from "./pages/users/accept-invite";
import { UsersCreate } from "./pages/users/create";
import { UsersList } from "./pages/users/list";

function AppInner() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const i18nProvider = useI18nProvider();

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: { borderRadius: 2 },
      }}
    >
      <AntdApp>
        <Refine
          authProvider={authProvider}
          i18nProvider={i18nProvider}
          dataProvider={{
            default: dataProvider,
            rest: restDataProvider,
          }}
          liveProvider={liveProvider}
          routerProvider={routerProvider}
          notificationProvider={useNotificationProvider}
          resources={[
            {
              name: "users",
              list: "/users",
              create: "/users/create",
              meta: { canDelete: false },
            },
            {
              name: "items",
              list: "/items",
              create: "/items/create",
              edit: "/items/edit/:id",
            },
          ]}
          options={{
            syncWithLocation: true,
            warnWhenUnsavedChanges: true,
            liveMode: "auto",
          }}
        >
          <Routes>
            <Route
              element={
                <Authenticated
                  key="auth-inner"
                  fallback={<CatchAllNavigate to="/login" />}
                >
                  <ThemedLayout
                    Header={Header}
                    Title={({ collapsed }) => (
                      <ThemedTitle
                        collapsed={collapsed}
                        text="Mineleng Admin"
                      />
                    )}
                  >
                    <Outlet />
                  </ThemedLayout>
                </Authenticated>
              }
            >
              <Route index element={<NavigateToResource resource="users" />} />
              <Route path="/users" element={<UsersList />}>
                <Route path="create" element={<UsersCreate />} />
              </Route>
              <Route path="/items" element={<ItemsList />} />
              <Route path="/items/create" element={<ItemsCreate />} />
              <Route path="/items/edit/:id" element={<ItemsEdit />} />
              <Route path="*" element={<ErrorComponent />} />
            </Route>
            <Route
              element={
                <Authenticated key="auth-outer" fallback={<Outlet />}>
                  <NavigateToResource resource="users" />
                </Authenticated>
              }
            >
              <Route path="/login" element={<LoginPage />} />
            <Route path="/accept-invite" element={<AcceptInvitePage />} />
            </Route>
          </Routes>
        </Refine>
      </AntdApp>
    </ConfigProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AppInner />
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
