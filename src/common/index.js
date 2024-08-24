const backendDomain = "http://localhost:8080";

const SummaryApi = {
    SignUp: {
        url: `${backendDomain}/api/signup`,
        method: 'post'
    },
    Login: {
        url: `${backendDomain}/api/login`,
        method: 'post'
    },
    current_user: {
        url: `${backendDomain}/api/user-details`,
        method: 'get'
    },
    Logout: {
        url: `${backendDomain}/api/logout`,
        method: 'get'
    },
    ChangeUsername: {
        url: `${backendDomain}/api/user-name-change`,
        method: 'post'
    },
    ChangePassword: {
        url: `${backendDomain}/api/user-password-change`,
        method: 'post'
    }
};

export default SummaryApi;