import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, Outlet } from 'react-router-dom';
import { userService } from '../services/user.service';
const ProtectedRoute = ({ redirectPath = '/login' }) => {
    const isAuthenticated = userService.isAuthenticated();
    if (!isAuthenticated) {
        return _jsx(Navigate, { to: redirectPath });
    }
    return _jsx(Outlet, {});
};
export default ProtectedRoute;
