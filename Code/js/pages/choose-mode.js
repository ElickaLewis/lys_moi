function switchMode(mode) {
    sessionStorage.setItem("active_mode", mode);

    if (mode === "reader") {
        goReaderDashboard();
        return;
    }

    if (mode === "writer") {
        goWriterDashboard();
        return;
    }

    if (mode === "admin") {
        goAdminDashboard();
        return;
    }

    goDashboard();
}

async function loadChooseModePage() {
    if (window.authReady) {
        await window.authReady;
    }

    const user = await getCurrentUser();

    if (!user) {
        goLogin();
        return;
    }

    const roles = getUserRoles(user);

    if (roles.length <= 1) {
        sessionStorage.setItem("active_mode", roles[0] || "reader");
        goDashboard();
        return;
    }

    const displayName =
        user?.user_metadata?.pseudo ||
        user?.user_metadata?.username ||
        user?.email?.split("@")[0] ||
        "toi";

    const title = document.getElementById("choose-title");
    const subtitle = document.getElementById("choose-subtitle");

    if (title) {
        title.textContent = `Bienvenue, ${displayName}`;
    }

    if (subtitle) {
        subtitle.textContent =
            "Tu peux choisir ton élan du moment : lire, écrire… et, si tu portes aussi la veille, garder un œil sur le jardin.";
    }

    if (roles.includes("reader")) {
        document.getElementById("reader-card").style.display = "block";
    }

    if (roles.includes("writer")) {
        document.getElementById("writer-card").style.display = "block";
    }

    if (roles.includes("admin")) {
        document.getElementById("admin-recap").style.display = "block";
        await loadAdminRecap();
    }
}

async function loadAdminRecap() {
    const reportsEl = document.getElementById("admin-reports-count");
    const supportEl = document.getElementById("admin-support-count");
    const pendingEl = document.getElementById("admin-pending-count");
    const connectedEl = document.getElementById("admin-connected-count");
    const newUsersEl = document.getElementById("admin-new-users-count");

    const safeSet = (element, value) => {
        if (element) {
            element.textContent = value;
        }
    };

    try {
        // Signalements
        const { count: reportsCount } = await window.supabaseClient
            .from("reports")
            .select("*", { count: "exact", head: true });

        // Support
        const { count: supportCount } = await window.supabaseClient
            .from("support_requests")
            .select("*", { count: "exact", head: true });

        // Textes en attente
        const { count: pendingStoriesCount } = await window.supabaseClient
            .from("stories")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending");

        const { count: pendingChaptersCount } = await window.supabaseClient
            .from("chapters")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending");

        // Utilisateurs récents / nouveaux
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const isoSevenDaysAgo = sevenDaysAgo.toISOString();

        const { count: newUsersCount } = await window.supabaseClient
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .gte("created_at", isoSevenDaysAgo);

        // Approximation propre pour "connectés"
        // Ici on prend les profils créés / actifs récents si tu n’as pas encore de vraie table de présence.
        const { count: connectedApproxCount } = await window.supabaseClient
            .from("profiles")
            .select("*", { count: "exact", head: true });

        safeSet(reportsEl, reportsCount ?? 0);
        safeSet(supportEl, supportCount ?? 0);
        safeSet(pendingEl, (pendingStoriesCount ?? 0) + (pendingChaptersCount ?? 0));
        safeSet(connectedEl, connectedApproxCount ?? 0);
        safeSet(newUsersEl, newUsersCount ?? 0);
    } catch (error) {
        console.error("Erreur chargement récap admin :", error);

        safeSet(reportsEl, "—");
        safeSet(supportEl, "—");
        safeSet(pendingEl, "—");
        safeSet(connectedEl, "—");
        safeSet(newUsersEl, "—");
    }
}

document.addEventListener("DOMContentLoaded", loadChooseModePage);