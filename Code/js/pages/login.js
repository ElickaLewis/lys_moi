const form = document.getElementById("login-form");
const feedback = document.getElementById("login-feedback");
const rememberCheckbox = document.getElementById("remember-me");
const rememberNote = document.getElementById("remember-note");

function normalizeIdentifier(value) {
    return value.trim().toLowerCase();
}

function updateRememberText() {
    if (rememberCheckbox.checked) {
        rememberNote.textContent =
            "Garde la porte entrouverte sur ton jardin : ta session restera active même après avoir fermé le navigateur.";
    } else {
        rememberNote.textContent =
            "Ferme doucement la porte derrière toi : ta session s’effacera lorsque tu quitteras le navigateur.";
    }
}

rememberCheckbox.addEventListener("change", updateRememberText);
updateRememberText();

async function getEmailFromIdentifier(identifier) {
    const normalized = normalizeIdentifier(identifier);

    const { data, error } = await window.supabaseClient
        .from("profiles")
        .select("email, pseudo, pseudo_normalized")
        .eq("pseudo_normalized", normalized)
        .maybeSingle();

    if (error) {
        console.error("Erreur recherche identifiant :", error);
        return null;
    }

    if (!data?.email) {
        return null;
    }

    return data.email;
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    feedback.textContent = "";

    const identifier = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const remember = rememberCheckbox.checked;

    if (!identifier || !password) {
        feedback.textContent = "Remplis ton identifiant et ton mot de passe.";
        return;
    }

    let email = identifier;

    if (!identifier.includes("@")) {
        const foundEmail = await getEmailFromIdentifier(identifier);

        if (!foundEmail) {
            feedback.textContent = "Identifiant introuvable.";
            return;
        }

        email = foundEmail;
    }

    const { error } = await window.supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        feedback.textContent = "Connexion impossible. Vérifie tes informations.";
        return;
    }

    localStorage.setItem("lys_remember_session", remember ? "true" : "false");
    sessionStorage.setItem("lys_session_active", "true");

    window.location.href = "dashboard.html";
});