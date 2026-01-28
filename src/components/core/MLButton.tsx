import React, { forwardRef } from 'react';
import { Button, ButtonProps, Tooltip } from 'antd';
import { TooltipPlacement } from 'antd/es/tooltip';

export type ExtendedSizeType = ButtonProps['size'] | 'tiny';

interface MLButtonProps extends Omit<ButtonProps, 'size'> {
  buttonType?:
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'danger'
    | 'neutral'
    | 'outline'
    | 'outline-primary'
    | 'outline-secondary'
    | 'outline-danger'
    | 'transparent'
    | 'link';
  tooltipText?: string;
  tooltipPlacement?: TooltipPlacement;
  size?: ExtendedSizeType;
  width?: string;
  height?: string;
}

/**
 * HOC Ant Design <Button> component (with forwardRef)
 * Allows for common button styling across the application with color styles for primary, secondary, tertiary, neutral, and danger.
 *
 * Usage:
 *  <MLButton buttonType='primary'>Save</MLButton>
 *  <MLButton buttonType='neutral' size='small' loading>Cancel</MLButton>
 *
 * Note: The forward ref is necessary due to this bug in ant-design: https://github.com/ant-design/ant-design/issues/48709
 */
export const MLButton = forwardRef<HTMLAnchorElement | HTMLButtonElement, MLButtonProps>(
  ({ buttonType = 'neutral', size = 'middle', className = '', width, height, tooltipText, tooltipPlacement, children, ...props }, ref) => {
    // Map buttonType to Ant Design classes
    const buttonClass = {
      'primary': 'ant-btn-primary',
      'secondary': 'ant-btn-secondary',
      'tertiary': 'ant-btn-tertiary',
      'danger': 'ant-btn-danger',
      'neutral': 'ant-btn-neutral',
      'outline': 'ant-btn-outline',
      'outline-primary': 'ant-btn-outline-primary',
      'outline-secondary': 'ant-btn-outline-secondary',
      'outline-danger': 'ant-btn-outline-danger',
      'transparent': 'ant-btn-transparent',
      'link': 'ant-btn-link',
    };

    // Combine classes: Compact + Custom + Focus styling
    let combinedClassName = `${className} ${buttonClass[buttonType] || ''}`.trim();

    // AntD Button size only supports 'small', 'middle', and 'large'
    const buttonSize = size === 'tiny' ? 'small' : size;
    const buttonWidth = width ? width : undefined;
    let buttonHeight = height ? height : undefined;
    if (size === 'tiny') {
      buttonHeight = '20px';
    }

    const buttonStyle = {
      height: buttonHeight,
      minWidth: buttonWidth,
    };

    // Reduce font size for small buttons
    if (size === 'small') {
      combinedClassName += ' text-xs!';
    } else if (size === 'tiny') {
      combinedClassName += ' text-xxs!';
    }

    const buttonElement = (
      <Button ref={ref} style={buttonStyle} className={combinedClassName} size={buttonSize} {...props}>
        {children}
      </Button>
    );

    return tooltipText ? (
      <Tooltip title={tooltipText} placement={tooltipPlacement}>
        {buttonElement}
      </Tooltip>
    ) : (
      buttonElement
    );
  },
);

MLButton.displayName = 'MLButton';
