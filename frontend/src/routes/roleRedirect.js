// Libraries
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const RoleRedirect = () => {
    const navigate = useNavigate();
    const userRole = localStorage.getItem('userRole');

    useEffect(() => {
        if (userRole === 'Admin') {
            navigate('/admin');
        } else if (userRole === 'User') {
            navigate('/client');
        } else {
            navigate('/home');
        }
    }, [userRole, navigate]);

    return null;
};

export default RoleRedirect;