import { theme } from 'antd';
import type { ThemeConfig } from 'antd';

const shared = {
  borderRadius: 6,
  borderRadiusLG: 8,
  borderRadiusSM: 4,
  fontFamily:
    "'Inter Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontSize: 14,
  lineHeight: 1.5,
  controlHeight: 36,
  controlHeightLG: 40,
  controlHeightSM: 28,
  colorError: '#dc2626',
  colorWarning: '#d97706',
  colorSuccess: '#16a34a',
};

export const shadcnDarkTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    ...shared,
    // Dark background tokens
    colorBgBase: '#141414',
    colorBgContainer: '#1f1f1f',
    colorBgElevated: '#2a2a2a',
    colorBgLayout: '#141414',
    colorBgSpotlight: '#3f3f3f',
    colorBorder: '#303030',
    colorBorderSecondary: '#262626',
    colorText: 'rgba(255,255,255,0.85)',
    colorTextSecondary: 'rgba(255,255,255,0.45)',
    colorTextTertiary: 'rgba(255,255,255,0.25)',
    colorTextQuaternary: 'rgba(255,255,255,0.15)',
    // Dark theme primary — zinc-900 on dark bg
    colorPrimary: '#e4e4e7',
    colorPrimaryHover: '#ffffff',
    colorPrimaryActive: '#a1a1aa',
    colorPrimaryBg: '#27272a',
    colorPrimaryBgHover: '#3f3f46',
    colorPrimaryBorder: '#52525b',
    colorPrimaryBorderHover: '#71717a',
    colorPrimaryText: '#e4e4e7',
    colorPrimaryTextHover: '#ffffff',
    colorPrimaryTextActive: '#a1a1aa',
  },
  components: {
    Button: {
      primaryShadow: 'none',
      defaultShadow: 'none',
      dangerShadow: 'none',
      colorTextLightSolid: '#141414',
      defaultBg: '#1f1f1f',
      defaultBorderColor: '#303030',
      defaultColor: 'rgba(255,255,255,0.85)',
    },
    Input: {
      activeShadow: 'none',
      colorBgContainer: '#1f1f1f',
      colorBorder: '#303030',
      hoverBorderColor: '#52525b',
      activeBorderColor: '#ffffff',
    },
    Select: {
      colorBgContainer: '#1f1f1f',
      colorBorder: '#303030',
      optionSelectedBg: '#27272a',
    },
    Modal: {
      borderRadiusLG: 8,
      contentBg: '#1f1f1f',
      headerBg: '#1f1f1f',
    },
    Table: {
      headerBg: '#141414',
      colorBgContainer: '#1f1f1f',
      rowHoverBg: '#2a2a2a',
    },
    Card: {
      colorBgContainer: '#1f1f1f',
      colorBorderSecondary: '#303030',
    },
    Drawer: {
      colorBgElevated: '#1f1f1f',
    },
    Menu: {
      itemBg: '#1f1f1f',
      itemSelectedBg: '#27272a',
      itemSelectedColor: '#ffffff',
    },
    Segmented: {
      itemSelectedBg: '#27272a',
      trackBg: '#141414',
    },
    Form: {
      labelColor: 'rgba(255,255,255,0.85)',
    },
    Tabs: {
      itemColor: 'rgba(255,255,255,0.45)',
      itemSelectedColor: 'rgba(255,255,255,0.85)',
    },
    Popover: {
      colorBgElevated: '#2a2a2a',
    },
    Tooltip: {
      colorBgSpotlight: '#3f3f3f',
    },
  },
};

export const shadcnTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#18181b',
    colorPrimaryHover: '#27272a',
    colorPrimaryActive: '#09090b',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#fafafa',
    colorBorder: '#e4e4e7',
    colorBorderSecondary: '#f4f4f5',
    colorText: '#18181b',
    colorTextSecondary: '#71717a',
    colorTextTertiary: '#a1a1aa',
    colorError: '#dc2626',
    colorWarning: '#d97706',
    colorSuccess: '#16a34a',
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    fontFamily:
      "'Inter Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 14,
    lineHeight: 1.5,
    controlHeight: 36,
    controlHeightLG: 40,
    controlHeightSM: 28,
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
    boxShadowSecondary: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  },
  components: {
    Button: {
      colorPrimary: '#18181b',
      colorPrimaryHover: '#27272a',
      algorithm: true,
      primaryShadow: 'none',
      defaultShadow: 'none',
      dangerShadow: 'none',
    },
    Input: {
      colorBorder: '#e4e4e7',
      hoverBorderColor: '#a1a1aa',
      activeBorderColor: '#18181b',
      activeShadow: 'none',
    },
    Select: {
      colorBorder: '#e4e4e7',
    },
    Table: {
      headerBg: '#fafafa',
      headerColor: '#71717a',
      rowHoverBg: '#f4f4f5',
    },
    Card: {
      colorBorderSecondary: '#e4e4e7',
    },
    Modal: {
      borderRadiusLG: 8,
    },
    Menu: {
      itemSelectedBg: '#f4f4f5',
      itemSelectedColor: '#18181b',
    },
    Segmented: {
      itemSelectedBg: '#ffffff',
      trackBg: '#f4f4f5',
      itemSelectedColor: '#18181b',
      itemColor: '#71717a',
    },
    Form: {
      labelColor: '#18181b',
    },
    Tabs: {
      itemColor: '#71717a',
      itemSelectedColor: '#18181b',
    },
    Popover: {
      colorBgElevated: '#ffffff',
    },
    Tooltip: {
      colorBgSpotlight: '#18181b',
    },
  },
};
