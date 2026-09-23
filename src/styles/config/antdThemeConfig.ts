import cssValues from './cssValues';
import React from 'react';

/**
 * One look for every text-entry control: Input, TextArea, Select, DatePicker,
 * InputNumber.
 *
 * These used to set `colorBorder` to white, which erased the boundary of any field
 * sitting on a white card — only DatePicker and InputNumber kept theirs, so a form
 * showed a mix of boxed and invisible fields. Screens then patched individual
 * inputs back with `shadow-sm` or `bg-[#f5f5f7]!`. The boundary belongs here, once:
 * a visible resting border, a darker hover, and an oak focus ring.
 */
const controlTokens = {
  colorBorder: cssValues.colors.controlBorder,
  hoverBorderColor: cssValues.colors.controlBorderHover,
  activeBorderColor: cssValues.colors.oak,
  activeShadow: `0 0 0 3px ${cssValues.colors.controlFocusRing}`,
  colorTextPlaceholder: cssValues.colors.controlPlaceholder,
};

/**
 * Ant Design theme configuration.
 */
const antdThemeConfig = {
  components: {
    Layout: {
      headerBg: cssValues.colors.white,
      bodyBg: cssValues.colors.white,
      siderBg: cssValues.colors.white,
      triggerBg: cssValues.colors.white,
      triggerColor: cssValues.colors.black,
    },
    Menu: {
      itemBg: cssValues.colors.white,
      itemColor: cssValues.colors.black,
      itemSelectedBg: cssValues.colors.gray100,
    },
    Select: {
      ...controlTokens,
      activeOutlineColor: cssValues.colors.controlFocusRing,
      optionSelectedBg: cssValues.colors.gray100,
    },
    Input: {
      ...controlTokens,
      colorPrimaryHover: cssValues.colors.oak,
    },
    InputNumber: controlTokens,
    Button: {
      colorBorder: 'none',
      fontWeight: 500,
    },
    Segmented: {
      itemColor: cssValues.colors.gray500,
    },
    DatePicker: controlTokens,
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

    colorPrimary: cssValues.colors.oak,
    colorSecondary: cssValues.colors.pistaccio,
    colorLinkHover: cssValues.colors.gray400,
    colorLink: cssValues.colors.blueDark,
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
