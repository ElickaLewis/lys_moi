async function handleDashboardRedirect() {
    if (window.authReady) {
        await window.authReady;
    }

    const user = await getCurrentUser();

    if (!user) {
        goHome();
        return;
    }

    const roles = getUserRoles(user);
    const activeMode = sessionStorage.getItem("active_mode");

    // 👉 Plusieurs rôles
    if (roles.length > 1) {
        if (activeMode && roles.includes(activeMode)) {
            goDashboardByMode(activeMode);
            return;
        }

        goChooseMode();
        return;
    }

    // 👉 Un seul rôle
    const role = roles[0];

    sessionStorage.setItem("active_mode", role);
    goDashboardByMode(role);
}

function goDashboardByMode(mode) {
    if (mode === "admin") {
        goAdminDashboard();
        return;
    }

    if (mode === "writer") {
        goWriterDashboard();
        return;
    }

    goReaderDashboard();
}

document.addEventListener("DOMContentLoaded", handleDashboardRedirect);