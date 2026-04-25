const signupForm = document.getElementById("signup-form");
const signupFeedback = document.getElementById("signup-feedback");

function normalizePseudo(value) {
    return value.trim().toLowerCase();
}

function isValidPseudo(value) {
    return /^[a-zA-Z0-9_-]{3,30}$/.test(value);
}

async function pseudoAlreadyExists(pseudoNormalized) {
    const { data, error } = await window.supabaseClient
        .from("profiles")
        .select("id")
        .eq("pseudo_normalized", pseudoNormalized)
        .maybeSingle();

    if (error) {
        console.error("Erreur vérification pseudo :", error);
        return false;
    }

    return !!data;
}

signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    signupFeedback.textContent = "";

    const pseudo = document.getElementById("pseudo").value.trim();
    const pseudoNormalized = normalizePseudo(pseudo);
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const birthdate = document.getElementById("birthdate").value;
    const role = document.getElementById("role").value;

    if (!pseudo || !email || !password || !confirmPassword || !birthdate || !role) {
        signupFeedback.textContent = "Merci de remplir tous les champs.";
        return;
    }

    if (!isValidPseudo(pseudo)) {
        signupFeedback.textContent = "Ton identifiant doit contenir entre 3 et 30 caractères, sans espace.";
        return;
    }

    if (password !== confirmPassword) {
        signupFeedback.textContent = "Les mots de passe ne correspondent pas.";
        return;
    }

    const pseudoExists = await pseudoAlreadyExists(pseudoNormalized);
    if (pseudoExists) {
        signupFeedback.textContent = "Cet identifiant est déjà utilisé.";
        return;
    }

    const { data, error } = await window.supabaseClient.auth.signUp({
        email,
        password,
        options: {
            data: {
                pseudo,
                roles: [role],
                role: role,
                birthdate
            }
        }
    });

    if (error) {
        signupFeedback.textContent = "Inscription impossible. Vérifie tes informations.";
        return;
    }

    const user = data.user;

    if (!user) {
        signupFeedback.textContent = "Compte créé, mais utilisateur introuvable juste après l’inscription.";
        return;
    }

    const { error: profileError } = await window.supabaseClient
        .from("profiles")
        .upsert({
            id: user.id,
            pseudo,
            pseudo_normalized: pseudoNormalized,
            email,
            role
        });

    if (profileError) {
        console.error("Erreur création profil :", profileError);
        signupFeedback.textContent =
            "Le compte a été créé, mais le profil n’a pas pu être enregistré correctement.";
        return;
    }

    signupFeedback.textContent =
        "Compte créé ✨ Vérifie ta boîte mail pour confirmer ton inscription.";
    signupForm.reset();
});