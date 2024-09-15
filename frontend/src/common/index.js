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
    refresh_access: {
        url: `${backendDomain}/api/refresh`,
        method: 'get'
    },
    Logout: {
        url: `${backendDomain}/api/logout`,
        method: 'get'
    },
    ChangeProfilePic: {
        url: `${backendDomain}/api/user-pic-change`,
        method: 'put'
    },
    RemoveProfilePic: {
        url: `${backendDomain}/api/user-pic-remove`,
        method: 'put'
    },
    ChangeUsername: {
        url: `${backendDomain}/api/user-name-change`,
        method: 'put'
    },
    DeleteAccount: {
        url: `${backendDomain}/api/user-delete`,
        method: 'post'
    },
    ChangePassword: {
        url: `${backendDomain}/api/user-password-change`,
        method: 'put'
    }
};

export default SummaryApi;