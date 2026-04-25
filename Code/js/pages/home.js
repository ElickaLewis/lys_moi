async function redirectLoggedUserFromHome() {
    if (window.authReady) {
        await window.authReady;
    }

    const user = await getCurrentUser();
    if (!user) return;

    const roles = getUserRoles(user);
    const activeMode = sessionStorage.getItem("active_mode");

    if (roles.length > 1) {
        if (activeMode && roles.includes(activeMode)) {
            goDashboard();
            return;
        }

        goChooseMode();
        return;
    }

    if (roles.includes("admin")) {
        sessionStorage.setItem("active_mode", "admin");
        goAdminDashboard();
        return;
    }

    if (roles.includes("writer")) {
        sessionStorage.setItem("active_mode", "writer");
        goWriterDashboard();
        return;
    }

    sessionStorage.setItem("active_mode", "reader");
    goReaderDashboard();
}

document.addEventListener("DOMContentLoaded", redirectLoggedUserFromHome);