import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCurrentUser } from 'hooks/useUser';
import { Avatar, Skeleton } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
export const UserProfile = () => {
    const { data: userData, isLoading } = useCurrentUser();
    if (isLoading) {
        return (_jsxs("div", { className: "mb-6 flex flex-col items-center", children: [_jsx(Skeleton.Avatar, { active: true, size: 70, shape: "circle" }), _jsx(Skeleton.Input, { active: true, size: "small", className: "mt-2" }), _jsx(Skeleton.Input, { active: true, size: "small", className: "mt-1" })] }));
    }
    if (!userData)
        return null;
    // Cast the user data to UserBase type to access the new fields
    const user = userData;
    // Format the wedding date if available
    // @ts-ignore
    const formattedDate = user?.weddingDate ? format(new Date(user?.weddingDate), 'MMMM d, yyyy') : '';
    // Get first name and spouse first name from user data
    const firstName = user.firstName || '';
    const spouseFirstName = user.spouseFirstName || null;
    return (_jsxs("div", { className: "mb-6 grid grid-cols-6", children: [_jsx("div", { className: "col-span-2 flex items-center", children: _jsx(Avatar, { size: 50, src: user.imageUrl || undefined, icon: !user.imageUrl ? _jsx(UserOutlined, {}) : undefined, className: "mb-2" }) }), _jsxs("div", { className: "flex flex-col col-span-4", children: [_jsxs("p", { className: "font-bold text-base mb-0", children: [firstName, " ", spouseFirstName ? `& ${spouseFirstName}` : ''] }), formattedDate && _jsx("p", { className: "text-xs text-gray-600 mb-0", children: formattedDate }), user?.weddingLocation && _jsx("p", { className: "text-xs text-gray-600", children: user?.weddingLocation })] })] }));
};
