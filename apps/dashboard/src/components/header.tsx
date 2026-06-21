import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { useGetIdentity, useSetLocale } from "@refinedev/core";
import type { RefineThemedLayoutHeaderProps } from "@refinedev/antd";
import { Avatar, Button, Layout, Space, Switch, Typography, theme } from "antd";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";

type Identity = { name?: string; image?: string };

const LOCALES = [
  { key: "en", label: "EN" },
  { key: "km", label: "ខ្មែរ" },
] as const;

export const Header = ({ sticky }: RefineThemedLayoutHeaderProps) => {
  const { token } = theme.useToken();
  const { data: user } = useGetIdentity<Identity>();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // useTranslation is reactive — re-renders whenever i18n.changeLanguage fires.
  // useGetLocale() from Refine is a plain getter and won't re-render on change.
  const { i18n } = useTranslation();
  const changeLocale = useSetLocale();
  const currentLang = (i18n.resolvedLanguage ?? i18n.language ?? "en").split("-")[0];

  const handleLocaleChange = (lang: string) => {
    i18n.changeLanguage(lang);   // updates react-i18next state → re-renders
    changeLocale(lang);           // updates Refine's i18nProvider context
  };

  return (
    <Layout.Header
      style={{
        backgroundColor: token.colorBgElevated,
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        padding: "0px 24px",
        height: 64,
        ...(sticky ? { position: "sticky", top: 0, zIndex: 1 } : {}),
      }}
    >
      <Space size="middle">
        <Space size={4}>
          {LOCALES.map(({ key, label }) => (
            <Button
              key={key}
              type={currentLang === key ? "primary" : "text"}
              size="small"
              onClick={() => handleLocaleChange(key)}
            >
              {label}
            </Button>
          ))}
        </Space>

        <Switch
          checked={isDark}
          onChange={(checked) => setTheme(checked ? "dark" : "light")}
          checkedChildren={<MoonOutlined />}
          unCheckedChildren={<SunOutlined />}
        />

        {user?.name && <Typography.Text strong>{user.name}</Typography.Text>}
        {user?.image && <Avatar src={user.image} alt={user.name} />}
      </Space>
    </Layout.Header>
  );
};
