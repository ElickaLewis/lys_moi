function readerPlaceholder(label) {
    alert(`${label} arrivera bientôt 🌿`);
}

function createReadingCard(story) {
    return `
        <article class="reading-card">
            <div class="reading-card-content">
                <div class="story-topline">
                    <span class="story-theme">${story.theme}</span>
                    ${story.hasUpdate ? `<span class="update-star" title="Nouveau depuis ta dernière lecture">✦</span>` : ""}
                </div>

                <div class="story-title">${story.title}</div>
                <div class="story-author">par ${story.author}</div>

                <div class="story-status">${story.statusText}</div>

                <div class="progress-label-row">
                    <span>Progression</span>
                    <span>${story.progress}%</span>
                </div>

                <div style="margin: 8px 0 12px;">
                    <div style="
                        width: 100%;
                        height: 12px;
                        border-radius: 999px;
                        background: #2f2f36;
                        border: 1px solid rgba(255,255,255,0.10);
                        overflow: hidden;
                    ">
                        <div style="
                            width: ${story.progress}%;
                            height: 100%;
                            background: #f0c674;
                            border-radius: 999px;
                            display: block;
                        "></div>
                    </div>
                </div>

                <div class="story-note">${story.note || ""}</div>

                <div class="story-actions">
                    <button
                        class="reader-mini-btn primary"
                        type="button"
                        onclick="readerPlaceholder('Reprendre ${story.title}')"
                    >
                        Reprendre
                    </button>

                    <button
                        class="reader-mini-btn"
                        type="button"
                        onclick="readerPlaceholder('Fiche de ${story.title}')"
                    >
                        Voir
                    </button>
                </div>
            </div>
        </article>
    `;
}

function createDiscoverCard(story) {
    return `
        <article class="discover-card">
            <div class="discover-visual"></div>

            <div class="discover-card-content">
                <div class="discover-badge">${story.badge}</div>
                <div class="discover-title">${story.title}</div>
                <div class="discover-author">par ${story.author}</div>
                <div class="discover-summary">${story.summary}</div>

                <div class="tag-row">
                    ${(story.tags || []).map(tag => `<span class="tag">${tag}</span>`).join("")}
                </div>

                <button
                    class="reader-mini-btn primary"
                    type="button"
                    onclick="readerPlaceholder('Découvrir ${story.title}')"
                >
                    Découvrir
                </button>
            </div>
        </article>
    `;
}

function createReplyItem(reply) {
    return `
        <article class="update-item">
            <div class="update-main">
                <div class="update-kicker">Réponse à ton commentaire</div>
                <div class="update-title">${reply.storyTitle}</div>
                <div class="update-text">
                    <strong>${reply.author}</strong> a répondu :
                    <br><br>
                    "${reply.text}"
                </div>
            </div>

            <div class="update-side">
                <div class="update-time">${reply.time}</div>
            </div>
        </article>
    `;
}

function createUpdateItem(item) {
    return `
        <article class="update-item">
            <div class="update-main">
                <div class="update-kicker">${item.kicker}</div>
                <div class="update-title">${item.title}</div>
                <div class="update-text">${item.text}</div>
            </div>

            <div class="update-side">
                <div class="update-time">${item.time}</div>
            </div>
        </article>
    `;
}

function startDiscoverAutoScroll() {
    const discoverGrid = document.getElementById("discover-grid");
    if (!discoverGrid) return;

    const cards = Array.from(discoverGrid.querySelectorAll(".discover-card"));
    if (cards.length <= 1) return;

    let currentIndex = 0;
    const delay = 4500;

    function goToIndex(index) {
        const targetCard = cards[index];
        if (!targetCard) return;

        discoverGrid.scrollTo({
            left: targetCard.offsetLeft - discoverGrid.offsetLeft,
            behavior: "smooth"
        });
    }

    goToIndex(0);

    setInterval(() => {
        currentIndex += 1;

        if (currentIndex >= cards.length) {
            currentIndex = 0;
        }

        goToIndex(currentIndex);
    }, delay);
}

async function loadReaderDashboard() {
    if (window.authReady) {
        await window.authReady;
    }

    const user = await getCurrentUser();

    if (!user) {
        goLogin();
        return;
    }

    const roles = getUserRoles(user);

    if (!roles.includes("reader")) {
        goDashboard();
        return;
    }

    sessionStorage.setItem("active_mode", "reader");

    const displayName =
        user?.user_metadata?.pseudo ||
        user?.user_metadata?.username ||
        user?.email?.split("@")[0] ||
        "toi";

    const titleEl = document.getElementById("reader-title");
    const subtitleEl = document.getElementById("reader-subtitle");

    if (titleEl) {
        titleEl.textContent = `Bienvenue, ${displayName}`;
    }

    if (subtitleEl) {
        subtitleEl.textContent =
            "Retrouve tes lectures en cours, laisse-toi surprendre par de nouvelles voix, et promène-toi parmi les œuvres de Lys Moi.";
    }

    const readingData = [
        {
            theme: "Héroïque Fantasy",
            title: "Le Chant des ronces",
            author: "Nominoé",
            statusText: "Tu t’étais arrêtée au chapitre 4. Un nouveau chapitre t’attend.",
            progress: 62,
            hasUpdate: true,
            note: "Une nouvelle poussée t’attend."
        },
        {
            theme: "Romance sombre",
            title: "Sous la cendre",
            author: "Elicka",
            statusText: "Lecture entamée, mais laissée en suspens depuis quelques jours.",
            progress: 28,
            hasUpdate: false,
            note: "Ton marque-page t’attend."
        },
        {
            theme: "Mystère",
            title: "La Maison aux vitres closes",
            author: "Aster",
            statusText: "Tu avances doucement. Le secret n’a pas encore livré son cœur.",
            progress: 47,
            hasUpdate: false,
            note: "Quelque chose t’attend derrière la prochaine porte."
        }
    ];

    const discoverData = [
        {
            badge: "À découvrir",
            title: "Les Brumes de Velours",
            author: "Myr",
            summary: "Une œuvre douce et trouble, entre mémoire, absence et battements retenus.",
            tags: ["Poétique", "Mystère", "Slow burn"]
        },
        {
            badge: "Élu du Lys",
            title: "Le Dernier serment",
            author: "Caël",
            summary: "Une promesse brisée, une guerre ancienne, et un amour qui refuse de mourir.",
            tags: ["Fantasy", "Guerre", "Passion"]
        },
        {
            badge: "Nouvelle voix",
            title: "Les heures de papier",
            author: "Iris",
            summary: "Un premier texte fragile et lumineux, qui parle de ce qu’on ose enfin déposer sur la page.",
            tags: ["Intime", "Émotion", "Contemporain"]
        },
        {
            badge: "À découvrir",
            title: "Les Veines du silence",
            author: "Lune",
            summary: "Un monde où le silence parle plus que les mots.",
            tags: ["Dark", "Symbolique"]
        },
        {
            badge: "Populaire",
            title: "La Cour des cendres",
            author: "Elya",
            summary: "Intrigues, pouvoir et secrets brûlants.",
            tags: ["Politique", "Drama"]
        },
        {
            badge: "Coup de cœur",
            title: "Fragments d’aube",
            author: "Nael",
            summary: "Une renaissance après la chute.",
            tags: ["Émotion", "Résilience"]
        }
    ];

    const repliesData = [
        {
            storyTitle: "Le Chant des ronces",
            author: "Nominoé",
            text: "J’ai beaucoup aimé ton retour, il m’a vraiment touchée 🌿",
            time: "Il y a 2h"
        },
        {
            storyTitle: "Sous la cendre",
            author: "Elicka",
            text: "Tu as parfaitement compris ce passage… ça me fait plaisir.",
            time: "Hier"
        }
    ];

    const updatesData = [
        {
            kicker: "Nouveau chapitre",
            title: "Le Chant des ronces a fleuri cette nuit",
            text: "Le chapitre 5 est maintenant disponible. Ton marque-page t’attend là où la forêt s’est interrompue.",
            time: "À l’instant"
        },
        {
            kicker: "Écho de lecture",
            title: "Un lecteur a laissé quelques mots sous Sous la cendre",
            text: "Les retours du jardin commencent à prendre forme. Certains textes attirent déjà des regards fidèles.",
            time: "Aujourd’hui"
        },
        {
            kicker: "Mouvement du jardin",
            title: "De nouvelles œuvres ont été déposées sur les chemins",
            text: "Lys Moi s’étoffe doucement. Plusieurs voix nouvelles se sont installées parmi les sentiers.",
            time: "Cette semaine"
        }
    ];

    const readingGrid = document.getElementById("reading-grid");
    const discoverGrid = document.getElementById("discover-grid");
    const repliesList = document.getElementById("replies-list");
    const updatesList = document.getElementById("updates-list");

    if (readingGrid) {
        readingGrid.innerHTML = readingData.map(createReadingCard).join("");
    }

    if (discoverGrid) {
        discoverGrid.innerHTML = discoverData.map(createDiscoverCard).join("");
        startDiscoverAutoScroll();
    }

    if (repliesList) {
        repliesList.innerHTML = repliesData.map(createReplyItem).join("");
    }

    if (updatesList) {
        updatesList.innerHTML = updatesData.map(createUpdateItem).join("");
    }
}

document.addEventListener("DOMContentLoaded", loadReaderDashboard);