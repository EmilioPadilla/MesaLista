import cssValues from './cssValues';
import React from 'react';

/**
 * Ant Design theme configuration.
 */
const antdThemeConfig = {
  components: {
    Layout: {
      headerBg: cssValues.colors.chai,
      siderBg: cssValues.colors.chai,
      triggerBg: cssValues.colors.chai,
    },
    Menu: {
      itemBg: cssValues.colors.chai,
      itemColor: cssValues.colors.white,
    },
    Select: {
      colorBorder: cssValues.colors.gray400,
      activeBorderColor: cssValues.colors.orange,
      optionSelectedBg: cssValues.colors.gray100,
      controlOutline: 'none',
      controlOutlineWidth: 0,
    },
    Form: {
      // This is valid despite the TS warning in App.tsx
      // marginLG: '14px',
    },
    Input: {
      activeShadow: 'none',
      activeBorderColor: cssValues.colors.orange,
      hoverBorderColor: 'none',
      defaultHoverBorderColor: 'none',
    },
    InputNumber: {
      activeShadow: 'none',
      activeBorderColor: cssValues.colors.orange,
      hoverBorderColor: 'none',
      defaultHoverBorderColor: 'none',
    },
    Button: {
      colorBorder: 'none',
      fontWeight: 500,
    },
    Segmented: {
      itemColor: cssValues.colors.gray500,
    },
    DatePicker: {
      activeShadow: 'none',
      activeBorderColor: cssValues.colors.orange,
    },
    Dropdown: {
      colorBorder: cssValues.colors.gray400,
      colorPrimaryHover: 'none',
    },
    Table: {
      bodySortBg: cssValues.colors.white,
      headerSortActiveBg: cssValues.colors.gray50,
    },
  },
  token: {
    fontFamily: cssValues.fonts.fontFamilySansSerif,

    colorPrimary: cssValues.colors.chai,
    colorSecondary: cssValues.colors.pistaccio,
    colorLinkHover: cssValues.colors.orange,
    colorLink: cssValues.colors.blueDark,
    colorPrimaryHover: 'none',
    colorBorder: cssValues.colors.gray400,

    colorSuccess: cssValues.colors.success,
    colorInfo: cssValues.colors.info,
    colorWarning: cssValues.colors.warning,
    colorError: cssValues.colors.error,

    // Tooltip background
    colorBgSpotlight: cssValues.colors.gray600,

    // Divider color
    colorSplit: cssValues.colors.gray300,

    paddingContentHorizontal: 12,
  },
};

/*
  ------------------------------
  Other common style definitions
  ------------------------------
*/

/**
 * Style for radio group in vertical layout.
 */
export const radioGroupStyle_vertical: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
};

export default antdThemeConfig;