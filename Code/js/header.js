function getDisplayName(user) {
    const metadata = user?.user_metadata || {};

    return (
        metadata.pseudo ||
        metadata.username ||
        user?.email?.split("@")[0] ||
        "Mon profil"
    );
}

function getAvatarUrl(user) {
    const metadata = user?.user_metadata || {};
    return metadata.avatar_url || "images/default-avatar.png";
}

function closeProfileDropdown() {
    const menu = document.getElementById("profile-dropdown-menu");
    if (menu) {
        menu.classList.remove("open");
    }
}

function toggleProfileDropdown(event) {
    event.stopPropagation();

    const menu = document.getElementById("profile-dropdown-menu");
    if (!menu) return;

    menu.classList.toggle("open");
}

let profileDropdownListenerAttached = false;

function setupProfileDropdown() {
    if (profileDropdownListenerAttached) return;
    profileDropdownListenerAttached = true;

    document.addEventListener("click", (event) => {
        const wrapper = document.querySelector(".profile-menu-wrapper");
        const menu = document.getElementById("profile-dropdown-menu");

        if (!wrapper || !menu) return;

        if (!wrapper.contains(event.target)) {
            menu.classList.remove("open");
        }
    });
}

async function renderHeader() {
    const headerRight = document.getElementById("header-right");
    if (!headerRight) return;

    if (window.authReady) {
        await window.authReady;
    }

    const currentPage = window.location.pathname.split("/").pop();
    const pagesWithoutGuestButtons = ["", "index.html", "login.html", "signup.html"];
    const pagesWithoutModeButtons = ["choose-mode.html"];

    const user = await getCurrentUser();

    if (!user) {
        if (pagesWithoutGuestButtons.includes(currentPage)) {
            headerRight.innerHTML = "";
            return;
        }

        headerRight.innerHTML = `
            <button class="header-btn" onclick="goLogin()">Connexion</button>
            <button class="header-btn" onclick="goSignup()">Inscription</button>
        `;
        return;
    }

    const roles = getUserRoles(user);
    const activeMode = sessionStorage.getItem("active_mode");
    const displayName = getDisplayName(user);
    const avatarUrl = getAvatarUrl(user);

    let modeButtons = "";

    if (!pagesWithoutModeButtons.includes(currentPage)) {
    if (roles.includes("reader") && activeMode !== "reader") {
        modeButtons += `<button class="header-btn" onclick="sessionStorage.setItem('active_mode','reader'); goReaderDashboard();">Lecture</button>`;
    }

    if (roles.includes("writer") && activeMode !== "writer") {
        modeButtons += `<button class="header-btn" onclick="sessionStorage.setItem('active_mode','writer'); goWriterDashboard();">Écriture</button>`;
    }

    if (roles.includes("admin") && activeMode !== "admin") {
        modeButtons += `<button class="header-btn" onclick="sessionStorage.setItem('active_mode','admin'); goAdminDashboard();">Admin</button>`;
    }
    }

    headerRight.innerHTML = `
        ${modeButtons}

        <div class="profile-menu-wrapper">
            <button class="header-btn profile-btn profile-trigger" onclick="toggleProfileDropdown(event)">
                <img class="header-avatar" src="${avatarUrl}" alt="Avatar">
                <span>${displayName}</span>
            </button>

            <div class="dropdown-menu" id="profile-dropdown-menu">
                <button class="dropdown-item" onclick="goDashboard()">Tableau de bord</button>
                <button class="dropdown-item" onclick="goWriterProfile()">Profil écrivain</button>
                <button class="dropdown-item" onclick="goSettings()">Paramètres</button>
                <div class="dropdown-separator"></div>
                <button class="dropdown-item" onclick="logout()">Déconnexion</button>
            </div>
        </div>
    `;

    setupProfileDropdown();
}

document.addEventListener("DOMContentLoaded", renderHeader);