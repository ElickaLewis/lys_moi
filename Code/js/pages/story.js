let currentStoryFontSize = parseInt(localStorage.getItem("reader_font_size"), 10) || 18;

function getStoryIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

function sanitizeText(value, fallback = "") {
    if (value === null || value === undefined) return fallback;
    return String(value);
}

function getStoryStatusLabel(status) {
    const normalized = sanitizeText(status).toLowerCase();

    if (normalized === "finished" || normalized === "complete" || normalized === "completed" || normalized === "terminée") {
        return "Terminée";
    }

    return "En cours";
}

function getStoryStatusClass(status) {
    return getStoryStatusLabel(status) === "Terminée"
        ? "story-status-finished"
        : "story-status-ongoing";
}

function normalizeTags(tags) {
    if (Array.isArray(tags)) return tags;
    if (typeof tags === "string" && tags.trim()) {
        return tags.split(",").map(tag => tag.trim()).filter(Boolean);
    }
    return [];
}

function renderStoryMeta(story) {
    const metaRow = document.getElementById("story-meta-row");
    const tagsRow = document.getElementById("story-tags-row");

    const category = sanitizeText(story.category, "Œuvre");
    const statusLabel = getStoryStatusLabel(story.status);
    const statusClass = getStoryStatusClass(story.status);
    const tags = normalizeTags(story.tags);

    if (metaRow) {
        metaRow.innerHTML = `
            <span class="story-pill">${category}</span>
            <span class="story-pill ${statusClass}">${statusLabel}</span>
        `;
    }

    if (tagsRow) {
        tagsRow.innerHTML = tags
            .map(tag => `<span class="story-tag">${tag}</span>`)
            .join("");
    }
}

function renderStoryCover(story) {
    const coverBox = document.getElementById("story-cover-box");
    if (!coverBox) return;

    const coverUrl =
        story.cover_url ||
        story.cover ||
        story.cover_image ||
        null;

    if (coverUrl) {
        coverBox.innerHTML = `<img src="${coverUrl}" alt="Couverture de ${sanitizeText(story.title, "l’histoire")}">`;
        return;
    }

    coverBox.innerHTML = `<div class="story-cover-placeholder">${sanitizeText(story.title, "Couverture")}</div>`;
}

function renderStoryChapters(chapters) {
    const readerContent = document.getElementById("story-reader-content");
    const chaptersList = document.getElementById("story-chapters-list");

    if (readerContent) {
        readerContent.innerHTML = chapters.map(chapter => `
            <section class="story-chapter" id="${chapter.domId}">
                <h3 class="chapter-title">${chapter.title}</h3>
                <div class="chapter-separator"></div>
                <div class="chapter-content">${chapter.html}</div>
            </section>
        `).join("");
    }

    if (chaptersList) {
        chaptersList.innerHTML = chapters.map(chapter => `
            <button
                class="story-chapter-link"
                type="button"
                data-target="${chapter.domId}"
                onclick="scrollToStoryChapter('${chapter.domId}', this)"
            >
                <span class="story-chapter-number">Chapitre ${chapter.number}</span>
                ${chapter.title}
            </button>
        `).join("");
    }
}

function scrollToStoryChapter(chapterId, button) {
    const target = document.getElementById(chapterId);
    if (!target) return;

    target.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    document.querySelectorAll(".story-chapter-link").forEach(link => {
        link.classList.remove("active");
    });

    if (button) {
        button.classList.add("active");
    }
}

function updateStoryFontSizeDisplay() {
    const display = document.getElementById("font-size-display");
    const content = document.getElementById("story-reader-content");

    if (display) {
        display.textContent = `${currentStoryFontSize} px`;
    }

    if (content) {
        content.style.fontSize = `${currentStoryFontSize}px`;
    }

    localStorage.setItem("reader_font_size", String(currentStoryFontSize));
}

function increaseStoryFontSize() {
    currentStoryFontSize = Math.min(currentStoryFontSize + 2, 30);
    updateStoryFontSizeDisplay();
}

function decreaseStoryFontSize() {
    currentStoryFontSize = Math.max(currentStoryFontSize - 2, 14);
    updateStoryFontSizeDisplay();
}

function toggleReaderFullscreen() {
    document.body.classList.toggle("reader-fullscreen");
}

async function fetchStoryById(storyId) {
    const { data, error } = await window.supabaseClient
        .from("stories")
        .select("*")
        .eq("id", storyId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

async function fetchAuthorName(authorId) {
    if (!authorId) return "Auteur inconnu";

    const { data, error } = await window.supabaseClient
        .from("profiles")
        .select("pseudo")
        .eq("id", authorId)
        .maybeSingle();

    if (error) {
        console.error("Erreur chargement auteur :", error);
        return "Auteur inconnu";
    }

    return data?.pseudo || "Auteur inconnu";
}

async function fetchChaptersByStoryId(storyId) {
    const { data, error } = await window.supabaseClient
        .from("chapters")
        .select("*")
        .eq("story_id", storyId)
        .order("chapter_number", { ascending: true });

    if (error) throw error;
    return data || [];
}

function buildRenderedChapters(rawChapters) {
    return rawChapters.map((chapter, index) => {
        const title =
            sanitizeText(chapter.title) ||
            sanitizeText(chapter.name) ||
            `Chapitre ${index + 1}`;

        const chapterNumber =
            chapter.chapter_number ??
            chapter.number ??
            index + 1;

        const html =
            chapter.content_html ||
            chapter.html ||
            chapter.content ||
            "<p>Ce chapitre est vide pour le moment.</p>";

        return {
            domId: `chapter-${chapter.id || index + 1}`,
            number: chapterNumber,
            title,
            html
        };
    });
}

async function loadStoryPage() {
    if (window.authReady) {
        await window.authReady;
    }

    const user = await getCurrentUser();

    if (!user) {
        goLogin();
        return;
    }

    const loadingBox = document.getElementById("story-loading");
    const errorBox = document.getElementById("story-error");
    const layout = document.getElementById("story-layout");

    try {
        const storyId = getStoryIdFromUrl();

        if (!storyId) {
            throw new Error("Aucun identifiant d’histoire dans l’URL.");
        }

        const story = await fetchStoryById(storyId);

        if (!story) {
            throw new Error("Histoire introuvable.");
        }

        const authorName = await fetchAuthorName(story.author_id || story.user_id || story.profile_id);
        const rawChapters = await fetchChaptersByStoryId(storyId);
        const chapters = buildRenderedChapters(rawChapters);
        const savedChapter = localStorage.getItem(`reading_progress_${storyId}`);

            if (savedChapter) {
    setTimeout(() => {
        const el = document.getElementById(savedChapter);
        if (el) {
            el.scrollIntoView({ behavior: "auto", block: "start" });
        }
    }, 100);

        document.getElementById("story-title").textContent = sanitizeText(story.title, "Sans titre");
        document.getElementById("story-author").textContent = `par ${authorName}`;
        document.getElementById("story-summary").textContent =
            sanitizeText(story.summary || story.description, "Aucun résumé pour le moment.");
        document.getElementById("reader-story-title").textContent = sanitizeText(story.title, "Sans titre");
        document.getElementById("reader-story-subtitle").textContent = `par ${authorName}`;

        renderStoryMeta(story);
        renderStoryCover(story);
        renderStoryChapters(chapters);

        
}

        updateStoryFontSizeDisplay();

        if (chapters.length > 0) {
            const firstButton = document.querySelector(".story-chapter-link");
            if (firstButton) {
                firstButton.classList.add("active");
            }
        } else {
            const content = document.getElementById("story-reader-content");
            const list = document.getElementById("story-chapters-list");

            if (content) {
                content.innerHTML = `<div class="story-info-box">Aucun chapitre publié pour le moment.</div>`;
            }

            if (list) {
                list.innerHTML = `<div class="story-info-box">Aucun chapitre pour l’instant.</div>`;
            }
        }

        if (loadingBox) loadingBox.style.display = "none";
        if (layout) layout.style.display = "grid";
    } catch (error) {
        console.error("Erreur chargement story :", error);

        if (loadingBox) loadingBox.style.display = "none";
        if (errorBox) {
            errorBox.style.display = "block";
            errorBox.textContent = "Impossible de charger cette histoire.";
        }
    }

    const readerScroll = document.querySelector(".story-reader-scroll");

if (readerScroll) {
    readerScroll.addEventListener("scroll", () => {
        saveReadingProgress(storyId);
    });
}
}

function saveReadingProgress(storyId) {
    const chapters = document.querySelectorAll(".story-chapter");

    let currentChapterId = null;

    chapters.forEach(chapter => {
        const rect = chapter.getBoundingClientRect();

        if (rect.top <= 150 && rect.bottom > 150) {
            currentChapterId = chapter.id;
        }
    });

    if (currentChapterId) {
        localStorage.setItem(`reading_progress_${storyId}`, currentChapterId);
    }
}

document.addEventListener("DOMContentLoaded", loadStoryPage);