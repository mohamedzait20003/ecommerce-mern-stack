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
    }
};

export default SummaryApi;