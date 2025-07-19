import { jsx as _jsx } from "react/jsx-runtime";
export const Collapsible = ({ isOpen, children, className = '' }) => {
    return (_jsx("div", { "data-testid": "collapsible", className: `transition-all duration-500 ${className} ${isOpen ? 'max-h-screen opacity-100 my-3' : 'max-h-0 opacity-0 overflow-hidden pointer-events-none'}`, children: children }));
};
