async function getCurrentUser() {
    const { data, error } = await window.supabaseClient.auth.getUser();

    if (error) {
        console.error("Erreur récupération utilisateur :", error);
        return null;
    }

    return data.user || null;
}

function getUserRoles(user) {
    const metadata = user?.user_metadata || {};

    if (Array.isArray(metadata.roles)) {
        return metadata.roles;
    }

    if (metadata.role) {
        return [metadata.role];
    }

    return ["reader"];
}

function hasRole(user, role) {
    const roles = getUserRoles(user);
    return roles.includes(role);
}

function isWriter(user) {
    return hasRole(user, "writer");
}

function isAdmin(user) {
    return hasRole(user, "admin");
}

async function logout() {
    await window.supabaseClient.auth.signOut();

    sessionStorage.removeItem("active_mode");
    sessionStorage.removeItem("lys_session_active");
    localStorage.removeItem("lys_remember_session");

    window.location.href = "index.html";
}

async function applySessionPreference() {
    const remember = localStorage.getItem("lys_remember_session");
    const sessionActive = sessionStorage.getItem("lys_session_active");

    if (remember === "true") {
        return;
    }

    if (!sessionActive) {
        await window.supabaseClient.auth.signOut();
        sessionStorage.removeItem("active_mode");
        sessionStorage.removeItem("lys_session_active");
    }
}

window.authReady = applySessionPreference();