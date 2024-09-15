// Libraries
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const RoleRedirect = () => {
    const navigate = useNavigate();
    const userRole = useSelector(state => state?.auth?.Role);

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