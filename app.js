const API = "https://api.tvmaze.com";
const NO_IMAGE = "https://placehold.co/210x295?text=No+Image";

const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const statusEl = document.querySelector("#status");
const genreSelect = document.querySelector("#genre");
const sortSelect = document.querySelector("#sort");
const grid = document.querySelector("#grid");
const modal = document.querySelector("#modal");
const modalBody = document.querySelector("#modal-body");

let shows = [];

async function getJSON(URL) {
    const res = await fetch(URL);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
}

function createCard(show) {
    const card = document.createElement("article");
    card.className = "bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700 hover:border-amber-400 transition cursor-pointer flex flex-col";
    card.dataset.id = show.id;
    const rating = show.rating?.average ?? "N/A";
    const imageUrl = show.image?.medium ?? NO_IMAGE;
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="${show.name}" class="w-full h-64 object-cover" loading="lazy">
        <div class="p-4 flex flex-col flex-grow justify-between">
            <h3 class="font-bold text-sm text-slate-100 truncate">${show.name}</h3>
            <p class="text-xs text-amber-400 mt-2 flex items-center gap-1">★ ${rating}</p>
        </div>
    `;
    return card;
}

function fillGenres() {
    const genres = [...new Set(shows.flatMap((s) => s.genres || []))].sort();
    genreSelect.innerHTML = '<option value="all">كل التصنيفات (All genres)</option>';
    
    genres.forEach((genre) => {
        const option = document.createElement("option");
        option.value = genre;
        option.textContent = genre;
        genreSelect.append(option);
    });
}

function render() {
    const genre = genreSelect.value;
    let list = genre === "all" ? shows : shows.filter((s) => s.genres && s.genres.includes(genre));
    
    const sortValue = sortSelect.value;
    if (sortValue === "rating") {
        list = [...list].sort((a, b) => (b.rating?.average ?? 0) - (a.rating?.average ?? 0));
    } else if (sortValue === "name") {
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    
    grid.innerHTML = "";
    list.forEach((show) => grid.append(createCard(show)));
    statusEl.textContent = list.length ? `${list.length} عرض متوفر` : "لا توجد عروض مطابقة";
}

async function loadShows(URL) {
    statusEl.textContent = "جاري التحميل...";
    grid.innerHTML = "";
    try {
        const data = await getJSON(URL);
        shows = data.map((item) => item.show ?? item);
        fillGenres();
        render();
    } catch (error) {
        statusEl.textContent = "تعذر تحميل العروض. حاول مرة أخرى.";
        console.error(error);
    }
}

searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = searchInput.value.trim();
    const url = q ? `${API}/search/shows?q=${encodeURIComponent(q)}` : `${API}/shows`;
    loadShows(url);
});

genreSelect.addEventListener("change", render);
sortSelect.addEventListener("change", render);

grid.addEventListener("click", (e) => {
    const card = e.target.closest("article");
    if (!card) return;
    const show = shows.find((s) => s.id === Number(card.dataset.id));
    if (show) openModal(show);
});

function stripTags(html) {
    return (html ?? "").replace(/<[^>]*>/g, "");
}

function openModal(show) {
    const imageUrl = show.image?.medium ?? NO_IMAGE;
    const rating = show.rating?.average ?? "N/A";
    const genres = show.genres?.join(", ") || "غير متوفر";
    const premiered = show.premiered ? show.premiered.split("-")[0] : "غير معروف";

    modalBody.innerHTML = `
        <img src="${imageUrl}" alt="${show.name}" class="w-full md:w-48 h-64 object-cover rounded-lg">
        <div class="flex flex-col justify-between flex-grow">
            <div>
                <h2 class="text-2xl font-bold text-amber-400 mb-2">${show.name}</h2>
                <p class="text-xs text-slate-400 mb-4">⭐ ${rating} | 📅 ${premiered} | 🎭 ${genres}</p>
                <p class="text-sm text-slate-300 leading-relaxed">${stripTags(show.summary) || "لا توجد نبذة مختصرة."}</p>
            </div>
        </div>
    `;
    modal.classList.remove("hidden");
}

function closeModal() {
    modal.classList.add("hidden");
}

modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.closest(".close")) closeModal();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
});

// التشغيل الأولي للموقع عند فتح الصفحة
loadShows(`${API}/shows`);