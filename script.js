/* CampusConnect - Pure HTML/CSS/JS SPA
   - Hash router for pages
   - LocalStorage auth (JWT placeholder)
   - Mock events with CRUD (Organizer Dashboard)
   - RSVP and Profile pages
   - Add-to-Calendar via ICS generation
   - Replace local stores with API calls when backend is ready
*/

/* -------------------------------
   Utilities
------------------------------- */
function $(sel, scope = document) { return scope.querySelector(sel); }
function $all(sel, scope = document) { return Array.from(scope.querySelectorAll(sel)); }
function formatDateISOToReadable(iso) {
    try {
        const d = new Date(iso);
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return iso; }
}
function toDateTimeLocalValue(d) {
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function uid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function downloadFile(filename, content, mime = 'text/plain;charset=utf-8') {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

/* -------------------------------
   Local Storage Keys and Store
------------------------------- */
const LS_KEYS = {
    users: 'cc_users',
    auth: 'cc_auth',
    events: 'cc_events',
    rsvps: 'cc_rsvps' // map of userId -> [eventIds]
};

const Store = {
    get(key, def) {
        try {
            const v = localStorage.getItem(key);
            return v ? JSON.parse(v) : def;
        } catch { return def; }
    },
    set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
};

/* Initialize demo data on first load */
(function initDemo() {
    if (!Store.get(LS_KEYS.events)) {
        const now = new Date();
        const e = [
            {
                id: uid(),
        title: "Web Development Workshop",
                description: "Learn modern frontend fundamentals with hands-on exercises.",
                date: new Date(now.getFullYear(), now.getMonth(), now.getDate()+2, 15, 0).toISOString(),
                endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()+2, 17, 0).toISOString(),
        location: "Tech Lab, Block A",
                host: "Coding Club",
                image: "",
                category: "Tech"
    },
    {
                id: uid(),
        title: "Robotics Competition",
                description: "Watch the annual robotics showdown. Teams from across the state compete.",
                date: new Date(now.getFullYear(), now.getMonth(), now.getDate()+7, 10, 0).toISOString(),
                endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()+7, 16, 0).toISOString(),
        location: "Main Auditorium",
                host: "Robotics Club",
                image: "",
                category: "Tech"
    },
    {
                id: uid(),
        title: "Data Science Seminar",
                description: "Intro to machine learning and data analytics with Python.",
                date: new Date(now.getFullYear(), now.getMonth(), now.getDate()+4, 11, 0).toISOString(),
                endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()+4, 13, 0).toISOString(),
        location: "Room 101, Block B",
                host: "Data Science Group",
                image: "",
                category: "Academic"
            },
            {
                id: uid(),
        title: "Cultural Fest Night",
                description: "Experience music, dance, and food from around the world.",
                date: new Date(now.getFullYear(), now.getMonth(), now.getDate()+9, 18, 30).toISOString(),
                endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()+9, 21, 30).toISOString(),
        location: "Central Lawn",
                host: "Student Union",
                image: "",
                category: "Culture"
            },
            {
                id: uid(),
        title: "Intramural Soccer Finals",
                description: "Cheer on the top intramural teams in the season finale.",
                date: new Date(now.getFullYear(), now.getMonth(), now.getDate()+5, 16, 0).toISOString(),
                endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()+5, 18, 0).toISOString(),
        location: "Sports Ground 2",
                host: "Athletics Dept.",
                image: "",
                category: "Sports"
            }
        ];
        Store.set(LS_KEYS.events, e);
    }
    if (!Store.get(LS_KEYS.users)) {
        const demo = [
            { id: uid(), name: "Organizer One", email: "org@uni.edu", password: "password", isOrganizer: true }
        ];
        Store.set(LS_KEYS.users, demo);
    }
    if (!Store.get(LS_KEYS.rsvps)) {
        Store.set(LS_KEYS.rsvps, {});
    }
})();

/* -------------------------------
   Auth
------------------------------- */
const Auth = {
    getSession() { return Store.get(LS_KEYS.auth, null); },
    isLoggedIn() { return !!this.getSession(); },
    currentUser() { return this.getSession()?.user || null; },
    login(email, password) {
        const users = Store.get(LS_KEYS.users, []);
        const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        if (!found) throw new Error("Invalid credentials");
        const token = "demo.jwt.token.placeholder";
        Store.set(LS_KEYS.auth, { token, user: { id: found.id, name: found.name, email: found.email, isOrganizer: !!found.isOrganizer } });
        return this.getSession();
    },
    signup(name, email, password, isOrganizer) {
        const users = Store.get(LS_KEYS.users, []);
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) throw new Error("Email already registered");
        const user = { id: uid(), name, email, password, isOrganizer: !!isOrganizer };
        users.push(user);
        Store.set(LS_KEYS.users, users);
        Store.set(LS_KEYS.auth, { token: "demo.jwt.token.placeholder", user: { id: user.id, name, email, isOrganizer: !!isOrganizer } });
        return this.getSession();
    },
    logout() { localStorage.removeItem(LS_KEYS.auth); }
};

/* -------------------------------
   Events + RSVP
------------------------------- */
const Events = {
    all() { return Store.get(LS_KEYS.events, []); },
    get(id) { return this.all().find(e => e.id === id) || null; },
    create(payload) {
        const events = this.all();
        const ev = { category: '', image: '', ...payload, id: uid() };
        events.unshift(ev);
        Store.set(LS_KEYS.events, events);
        return ev;
    },
    update(id, payload) {
        const events = this.all();
        const i = events.findIndex(e => e.id === id);
        if (i === -1) throw new Error("Event not found");
        events[i] = { ...events[i], ...payload, id };
        Store.set(LS_KEYS.events, events);
        return events[i];
    },
    remove(id) {
        const events = this.all().filter(e => e.id !== id);
        Store.set(LS_KEYS.events, events);
        const r = Store.get(LS_KEYS.rsvps, {});
        Object.keys(r).forEach(uid => {
            r[uid] = (r[uid] || []).filter(eid => eid !== id);
        });
        Store.set(LS_KEYS.rsvps, r);
    },
    rsvp(eventId, userId) {
        const r = Store.get(LS_KEYS.rsvps, {});
        const list = new Set(r[userId] || []);
        list.add(eventId);
        r[userId] = Array.from(list);
        Store.set(LS_KEYS.rsvps, r);
    },
    unrsvp(eventId, userId) {
        const r = Store.get(LS_KEYS.rsvps, {});
        r[userId] = (r[userId] || []).filter(id => id !== eventId);
        Store.set(LS_KEYS.rsvps, r);
    },
    byUser(userId) {
        const ids = Store.get(LS_KEYS.rsvps, {})[userId] || [];
        return this.all().filter(e => ids.includes(e.id));
    }
};

/* -------------------------------
   Navbar rendering
------------------------------- */
function renderNavbar() {
    const navAuth = document.getElementById('nav-auth');
    const dash = document.getElementById('nav-dashboard');
    const profile = document.getElementById('nav-profile');

    const session = Auth.getSession();
    navAuth.innerHTML = '';
    if (session) {
        const span = document.createElement('span');
        span.className = 'user-chip';
        span.textContent = session.user.name;

        const logout = document.createElement('button');
        logout.className = 'btn btn-ghost';
        logout.textContent = 'Logout';
        logout.addEventListener('click', () => {
            Auth.logout();
            renderNavbar();
            Router.go('#/login');
        });

        navAuth.appendChild(span);
        navAuth.appendChild(logout);

        profile.classList.remove('hidden');
        if (session.user.isOrganizer) dash.classList.remove('hidden'); else dash.classList.add('hidden');
    } else {
        const login = document.createElement('a');
        login.href = '#/login';
        login.className = 'btn';
        login.textContent = 'Login';

        const signup = document.createElement('a');
        signup.href = '#/signup';
        signup.className = 'btn btn-primary';
        signup.textContent = 'Sign Up';

        navAuth.appendChild(login);
        navAuth.appendChild(signup);

        dash.classList.add('hidden');
        profile.classList.add('hidden');
    }
}

/* -------------------------------
   Components
------------------------------- */
function EventCard(event) {
    const start = new Date(event.date);
    const bg = (event.image || '').trim() ? `style="background-image:url('${event.image}'); background-size:cover; background-position:center;"` : '';
    const cat = (event.category || '').trim();
    const catClass = categoryClass(cat);
    return `
        <article class="card">
            <div class="img" ${bg}></div>
            <div class="card-inner">
                <div class="card-title">${event.title}</div>
                <div class="card-meta">
                    <span class="badge">📅 ${start.toLocaleString()}</span>
                    <span class="badge">📍 ${event.location}</span>
                    <span class="badge">🏷️ ${event.host}</span>
                </div>
                <p class="event-desc">${event.description}</p>
                <div class="row">
                    <a class="btn btn-primary" href="#/event/${event.id}">View Details</a>
                    <span class="right pill ${catClass}">${cat || 'General'}</span>
                </div>
            </div>
        </article>
    `;
}

function categoryClass(category) {
    const c = (category || '').toLowerCase();
    if (c.includes('tech') || c.includes('dev') || c.includes('robot')) return 'pill--tech';
    if (c.includes('culture') || c.includes('music') || c.includes('art')) return 'pill--culture';
    if (c.includes('sport') || c.includes('game')) return 'pill--sports';
    if (c.includes('academic') || c.includes('seminar') || c.includes('lecture')) return 'pill--academic';
    return '';
}

function ConfirmModal({ title = 'Confirm', body = '', confirmText = 'Confirm', cancelText = 'Cancel', onConfirm = () => {}, onCancel = () => {} }) {
    const overlay = document.getElementById('modal-root');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    const actionsEl = document.getElementById('modal-actions');
    const closeBtn = document.getElementById('modal-close');

    titleEl.textContent = title;
    bodyEl.innerHTML = body;
    actionsEl.innerHTML = '';

    const cancel = document.createElement('button');
    cancel.className = 'btn';
    cancel.textContent = cancelText;
    const confirm = document.createElement('button');
    confirm.className = 'btn btn-danger';
    confirm.textContent = confirmText;

    actionsEl.appendChild(cancel);
    actionsEl.appendChild(confirm);

    function hide() {
        overlay.classList.add('hidden');
        cancel.removeEventListener('click', cancelHandler);
        confirm.removeEventListener('click', confirmHandler);
        closeBtn.removeEventListener('click', cancelHandler);
    }
    function cancelHandler() { onCancel(); hide(); }
    function confirmHandler() { onConfirm(); hide(); }

    cancel.addEventListener('click', cancelHandler);
    confirm.addEventListener('click', confirmHandler);
    closeBtn.addEventListener('click', cancelHandler);

    overlay.classList.remove('hidden');
}

/* -------------------------------
   Add to Calendar (ICS)
------------------------------- */
function generateICS(event) {
    const dt = (d) => {
        const x = new Date(d);
        const y = x.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        return y;
    };
    const ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//CampusConnect//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        `UID:${event.id}@campusconnect.local`,
        `DTSTAMP:${dt(new Date())}`,
        `DTSTART:${dt(event.date)}`,
        `DTEND:${dt(event.endDate || event.date)}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description}`,
        `LOCATION:${event.location}`,
        "END:VEVENT",
        "END:VCALENDAR"
    ].join("\r\n");
    return ics;
}

/* -------------------------------
   Router
------------------------------- */
const Router = {
    routes: [],
    add(path, handler) { this.routes.push({ path, handler }); return this; },
    parse(hash) {
        const h = hash.replace(/^#/, '') || '/';
        return h;
    },
    match(path) {
        for (const r of this.routes) {
            const params = {};
            const rSeg = r.path.split('/').filter(Boolean);
            const pSeg = path.split('/').filter(Boolean);
            if (rSeg.length !== pSeg.length) continue;
            let ok = true;
            for (let i = 0; i < rSeg.length; i++) {
                if (rSeg[i].startsWith(':')) {
                    params[rSeg[i].slice(1)] = decodeURIComponent(pSeg[i]);
                } else if (rSeg[i] !== pSeg[i]) { ok = false; break; }
            }
            if (ok) return { handler: r.handler, params };
        }
        return null;
    },
    render() {
        const path = this.parse(location.hash);
        const match = this.match(path);
        if (match) match.handler(match.params);
        else this.go('#/');
    },
    go(href) { location.hash = href; }
};

window.addEventListener('hashchange', () => {
    renderNavbar();
    Router.render();
});

/* -------------------------------
   Pages
------------------------------- */
function HomePage() {
    const app = document.getElementById('app');
    const events = Events.all();

    app.innerHTML = `
        <section class="container">
            <div class="hero">
                <div class="page-header">
                    <div>
                        <h1>Find your next campus event</h1>
                        <div class="subtitle mt-2">Discover featured and upcoming events across campus.</div>
                    </div>
                </div>
                <div class="searchbar mt-3">
                    <input class="input" id="searchText" placeholder="Search by title, description, host...">
                    <select class="select" id="hostFilter">
                        <option value="">All hosts</option>
                        ${Array.from(new Set(events.map(e => e.host))).map(h => `<option value="${h}">${h}</option>`).join('')}
                    </select>
                    <select class="select" id="categoryFilter">
                        <option value="">All categories</option>
                        ${Array.from(new Set(events.map(e => e.category).filter(Boolean))).map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select>
                    <input class="input" id="dateFrom" type="date" placeholder="From">
                    <input class="input" id="dateTo" type="date" placeholder="To">
                    <select class="select" id="sortBy">
                        <option value="dateAsc">Sort: Date ↑</option>
                        <option value="dateDesc">Sort: Date ↓</option>
                        <option value="titleAsc">Sort: Title A–Z</option>
                        <option value="titleDesc">Sort: Title Z–A</option>
                    </select>
                    <button class="btn" id="searchBtn">Search</button>
                    <button class="btn btn-ghost" id="clearBtn">Clear</button>
                </div>
            </div>
        </section>
        <section class="container">
            <div id="eventsGrid" class="grid grid-3"></div>
            <div id="emptyState" class="alert mt-3" style="display:none;">No events match your filters. Try adjusting search or dates.</div>
        </section>
    `;

    function renderList(list) {
        const grid = $('#eventsGrid');
        grid.innerHTML = list.map(EventCard).join('');
        $('#emptyState').style.display = list.length ? 'none' : 'block';
    }

    function applyFilters() {
        const q = $('#searchText').value.trim().toLowerCase();
        const host = $('#hostFilter').value;
        const category = $('#categoryFilter').value;
        const dateFrom = $('#dateFrom').value ? new Date($('#dateFrom').value) : null;
        const dateTo = $('#dateTo').value ? new Date($('#dateTo').value) : null;
        const sortBy = $('#sortBy').value;

        let filtered = events.filter(e => {
            const textMatch = [e.title, e.description, e.host, e.location, e.category]
                .some(t => (t || '').toLowerCase().includes(q));
            const hostMatch = host ? e.host === host : true;
            const catMatch = category ? (e.category === category) : true;
            const d = new Date(e.date);
            const fromOk = dateFrom ? d >= dateFrom : true;
            const toOk = dateTo ? d <= new Date(dateTo.getTime() + 24*60*60*1000 - 1) : true;
            return textMatch && hostMatch && catMatch && fromOk && toOk;
        });

        filtered.sort((a,b) => {
            if (sortBy === 'dateAsc') return new Date(a.date) - new Date(b.date);
            if (sortBy === 'dateDesc') return new Date(b.date) - new Date(a.date);
            if (sortBy === 'titleAsc') return a.title.localeCompare(b.title);
            if (sortBy === 'titleDesc') return b.title.localeCompare(a.title);
            return 0;
        });

        renderList(filtered);
    }

    $('#searchBtn').addEventListener('click', applyFilters);
    $('#clearBtn').addEventListener('click', () => {
        $('#searchText').value = '';
        $('#hostFilter').value = '';
        $('#categoryFilter').value = '';
        $('#dateFrom').value = '';
        $('#dateTo').value = '';
        $('#sortBy').value = 'dateAsc';
        renderList(events);
    });

    $('#searchText').addEventListener('input', applyFilters);
    $('#hostFilter').addEventListener('change', applyFilters);
    $('#categoryFilter').addEventListener('change', applyFilters);
    $('#dateFrom').addEventListener('change', applyFilters);
    $('#dateTo').addEventListener('change', applyFilters);
    $('#sortBy').addEventListener('change', applyFilters);

    renderList(events);
}

function EventDetailsPage({ id }) {
    const app = document.getElementById('app');
    const ev = Events.get(id);
    if (!ev) {
        app.innerHTML = `<section class="container"><div class="alert">Event not found.</div></section>`;
        return;
    }
    const session = Auth.getSession();
    const isRSVPd = session ? (Store.get(LS_KEYS.rsvps, {})[session.user.id] || []).includes(ev.id) : false;

    app.innerHTML = `
        <section class="container">
            <div class="card">
                <div class="img"></div>
                <div class="card-inner">
                    <div class="page-header">
                        <div>
                            <h1>${ev.title}</h1>
                            <div class="card-meta mt-2">
                                <span class="badge">📅 ${new Date(ev.date).toLocaleString()}</span>
                                <span class="badge">📍 ${ev.location}</span>
                                <span class="badge">🏷️ ${ev.host}</span>
                            </div>
                        </div>
                        <a class="btn" href="#/">Back</a>
                    </div>
                    <p class="event-desc">${ev.description}</p>
                    <div class="row mt-2">
                        <button class="btn ${isRSVPd ? 'btn-warning' : 'btn-success'}" id="rsvpBtn">${isRSVPd ? 'Cancel RSVP' : 'RSVP'}</button>
                        <button class="btn btn-primary" id="calBtn">Add to Calendar</button>
                        <span class="right pill">ID: ${ev.id.slice(0,6)}</span>
                    </div>
                    ${!session ? `<div class="alert mt-3">Please <a href="#/login">log in</a> to RSVP.</div>` : ''}
                </div>
            </div>
        </section>
    `;

    $('#rsvpBtn')?.addEventListener('click', () => {
        const s = Auth.getSession();
        if (!s) { Router.go('#/login'); return; }
        if (isRSVPd) {
            Events.unrsvp(ev.id, s.user.id);
        } else {
            Events.rsvp(ev.id, s.user.id);
        }
        EventDetailsPage({ id });
    });

    $('#calBtn').addEventListener('click', () => {
        const ics = generateICS(ev);
        const safeTitle = ev.title.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
        downloadFile(`${safeTitle}.ics`, ics, 'text/calendar');
    });
}

function LoginPage() {
    if (Auth.isLoggedIn()) { Router.go('#/'); return; }
    const app = document.getElementById('app');
    app.innerHTML = `
        <section class="container">
            <div class="card">
                <div class="card-inner">
                    <h2>Login</h2>
                    <p class="kicker mt-2">Use demo account: org@uni.edu / password</p>
                    <form id="loginForm" class="mt-3">
                        <div class="form-row">
                            <label>Email</label>
                            <input class="input" name="email" type="email" placeholder="you@university.edu" required>
                        </div>
                        <div class="form-row">
                            <label>Password</label>
                            <input class="input" name="password" type="password" placeholder="••••••••" required>
                        </div>
                        <div class="row mt-3">
                            <button class="btn btn-primary" type="submit">Login</button>
                            <a class="btn" href="#/signup">Create account</a>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    `;

    $('#loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        try {
            Auth.login(data.email, data.password);
            renderNavbar();
            Router.go('#/');
        } catch (err) {
            alert(err.message || 'Login failed');
        }
    });
}

function SignupPage() {
    if (Auth.isLoggedIn()) { Router.go('#/'); return; }
    const app = document.getElementById('app');
    app.innerHTML = `
        <section class="container">
            <div class="card">
                <div class="card-inner">
                    <h2>Create Account</h2>
                    <form id="signupForm" class="mt-3">
                        <div class="form-row form-row-2">
                            <div>
                                <label>Name</label>
                                <input class="input" name="name" placeholder="Full name" required>
                            </div>
                            <div>
                                <label>Email</label>
                                <input class="input" name="email" type="email" placeholder="you@university.edu" required>
                            </div>
                        </div>
                        <div class="form-row form-row-2">
                            <div>
                                <label>Password</label>
                                <input class="input" name="password" type="password" placeholder="••••••••" required>
                            </div>
                            <div>
                                <label>Role</label>
                                <select class="select" name="isOrganizer">
                                    <option value="false">Attendee</option>
                                    <option value="true">Organizer</option>
                                </select>
                            </div>
                        </div>
                        <div class="row mt-3">
                            <button class="btn btn-primary" type="submit">Sign Up</button>
                            <a class="btn" href="#/login">I have an account</a>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    `;

    $('#signupForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());
        try {
            Auth.signup(data.name, data.email, data.password, data.isOrganizer === 'true');
            renderNavbar();
            Router.go('#/');
        } catch (err) {
            alert(err.message || 'Signup failed');
        }
    });
}

function ProfilePage() {
    const session = Auth.getSession();
    if (!session) { Router.go('#/login'); return; }
    const app = document.getElementById('app');
    const rsvped = Events.byUser(session.user.id);

    app.innerHTML = `
        <section class="container">
            <div class="page-header">
                <div>
                    <h2>Profile</h2>
                    <div class="subtitle mt-2">${session.user.name} • ${session.user.email}</div>
                </div>
                <a href="#/" class="btn">Browse Events</a>
            </div>
            <div class="card mt-3">
                <div class="card-inner">
                    <h3>My RSVPs</h3>
                    <div id="myRsvps" class="grid grid-3 mt-3"></div>
                    ${rsvped.length === 0 ? `<div class="alert mt-3">No RSVPs yet. Explore events on the Home page.</div>` : ''}
                </div>
            </div>
        </section>
    `;

    $('#myRsvps').innerHTML = rsvped.map(EventCard).join('');
}

function DashboardPage() {
    const session = Auth.getSession();
    if (!session || !session.user.isOrganizer) {
        Router.go('#/login');
        return;
    }
    const app = document.getElementById('app');
    app.innerHTML = `
        <section class="container">
            <div class="page-header">
                <div>
                    <h2>Organizer Dashboard</h2>
                    <div class="subtitle mt-2">Create, edit, and delete events.</div>
                </div>
                <button class="btn btn-primary" id="newEventBtn">New Event</button>
            </div>

            <div class="card">
                <div class="card-inner">
                    <div class="table-wrap">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th class="hidden-sm">Date</th>
                                    <th>Location</th>
                                    <th>Host</th>
                                    <th class="right">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="eventsRows"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    `;

    function renderRows() {
        const rows = Events.all().map(e => `
            <tr>
                <td><a href="#/event/${e.id}">${e.title}</a></td>
                <td class="hidden-sm">${new Date(e.date).toLocaleString()}</td>
                <td>${e.location}</td>
                <td>${e.host}</td>
                <td class="right">
                    <button class="btn btn-ghost" data-edit="${e.id}">Edit</button>
                    <button class="btn btn-danger" data-delete="${e.id}">Delete</button>
                </td>
            </tr>
        `).join('');
        $('#eventsRows').innerHTML = rows || `<tr><td colspan="5">No events yet.</td></tr>`;
    }

    function openEditor(existing) {
        const start = existing ? new Date(existing.date) : new Date();
        const end = existing ? new Date(existing.endDate || existing.date) : new Date(Date.now() + 60*60*1000);

        const body = document.createElement('div');
        body.innerHTML = `
            <form id="eventForm">
                <div class="form-row form-row-2">
                    <div>
                        <label>Title</label>
                        <input class="input" name="title" required value="${existing ? existing.title.replace(/"/g,'&quot;') : ''}">
                    </div>
                    <div>
                        <label>Host</label>
                        <input class="input" name="host" required value="${existing ? existing.host.replace(/"/g,'&quot;') : ''}">
                    </div>
                </div>
                <div class="form-row form-row-2">
                    <div>
                        <label>Start</label>
                        <input class="input" name="date" type="datetime-local" required value="${toDateTimeLocalValue(start)}">
                    </div>
                    <div>
                        <label>End</label>
                        <input class="input" name="endDate" type="datetime-local" required value="${toDateTimeLocalValue(end)}">
                    </div>
                </div>
                <div class="form-row form-row-2">
                    <div>
                        <label>Location</label>
                        <input class="input" name="location" required value="${existing ? existing.location.replace(/"/g,'&quot;') : ''}">
                    </div>
                    <div>
                        <label>Image URL (optional)</label>
                        <input class="input" name="image" value="${existing ? (existing.image || '').replace(/"/g,'&quot;') : ''}">
                    </div>
                </div>
                <div class="form-row">
                    <label>Category</label>
                    <select class="select" name="category">
                        ${["", "Tech", "Academic", "Culture", "Sports"].map(c => `<option value="${c}" ${existing && existing.category === c ? 'selected' : ''}>${c || 'General'}</option>`).join('')}
                    </select>
                </div>
                <div class="form-row">
                    <label>Description</label>
                    <textarea class="textarea" name="description" required>${existing ? existing.description : ''}</textarea>
                </div>
            </form>
        `;
        ConfirmModal({
            title: existing ? 'Edit Event' : 'New Event',
            body: body.outerHTML,
            confirmText: existing ? 'Save' : 'Create',
            onConfirm: () => {
                const f = document.getElementById('eventForm');
                const fd = new FormData(f);
                const data = Object.fromEntries(fd.entries());
                const payload = {
                    title: data.title.trim(),
                    description: data.description.trim(),
                    date: new Date(data.date).toISOString(),
                    endDate: new Date(data.endDate).toISOString(),
                    location: data.location.trim(),
                    host: data.host.trim(),
                    image: data.image.trim(),
                    category: (data.category || '').trim()
                };
                if (existing) Events.update(existing.id, payload);
                else Events.create(payload);
                renderRows();
            }
        });
    }

    $('#newEventBtn').addEventListener('click', () => openEditor(null));
    $('#eventsRows').addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-edit');
        const del = e.target.getAttribute('data-delete');
        if (id) {
            const existing = Events.get(id);
            if (existing) openEditor(existing);
        } else if (del) {
            const existing = Events.get(del);
            if (!existing) return;
            ConfirmModal({
                title: 'Delete Event',
                body: `<p>Are you sure you want to delete "<strong>${existing.title}</strong>"?</p>`,
                confirmText: 'Delete',
                onConfirm: () => { Events.remove(existing.id); renderRows(); }
            });
        }
    });

    renderRows();
}

function NotFoundPage() {
    $('#app').innerHTML = `
        <section class="container">
            <div class="alert">Page not found. <a href="#/">Go Home</a></div>
        </section>
    `;
}

/* -------------------------------
   Route Definitions
------------------------------- */
Router
    .add('/', HomePage)
    .add('/event/:id', ({ id }) => EventDetailsPage({ id }))
    .add('/login', LoginPage)
    .add('/signup', SignupPage)
    .add('/profile', ProfilePage)
    .add('/dashboard', DashboardPage);

/* -------------------------------
   Startup
------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('year').textContent = new Date().getFullYear();
    renderNavbar();
    Router.render();
});

/* -------------------------------
   Backend Integration Notes
------------------------------- */
/*
Replace local storage calls with API requests when backend is available:

- Auth.login(email, password):
    - POST /api/auth/login with { email, password }
    - Expect { token, user: { id, name, email, isOrganizer } }
    - Save to localStorage for session persistence.

- Auth.signup(...):
    - POST /api/auth/signup with { name, email, password, isOrganizer }

- Events CRUD:
    - GET /api/events                  -> Events.all()
    - GET /api/events/:id              -> Events.get()
    - POST /api/events                 -> Events.create()
    - PUT /api/events/:id              -> Events.update()
    - DELETE /api/events/:id           -> Events.remove()

- RSVP:
    - POST /api/events/:id/rsvp
    - DELETE /api/events/:id/rsvp
    - GET /api/users/:id/rsvps         -> Events.byUser()

Add Authorization header with Bearer token stored in LS_KEYS.auth.token.
*/


