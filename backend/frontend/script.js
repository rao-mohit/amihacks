const API = "http://127.0.0.1:5000/api";

let currentUser =
    JSON.parse(localStorage.getItem("currentUser")) || null;

let userLatitude = null;
let userLongitude = null;

let donationLatitude = null;
let donationLongitude = null;


/* =====================================================
   MODALS
===================================================== */

function openLogin() {
    document.getElementById("loginModal").style.display = "flex";
}

function openRegister() {
    document.getElementById("registerModal").style.display = "flex";
}

function closeModal(id) {
    document.getElementById(id).style.display = "none";
}

function switchToRegister() {
    closeModal("loginModal");
    openRegister();
}

function switchToLogin() {
    closeModal("registerModal");
    openLogin();
}


/* =====================================================
   ROLE FIELDS
===================================================== */

function changeRoleFields() {

    const role =
        document.getElementById("registerRole").value;

    document
        .getElementById("ngoFields")
        .classList.toggle("hidden", role !== "ngo");

    document
        .getElementById("driverFields")
        .classList.toggle("hidden", role !== "driver");
}


/* =====================================================
   LOCATION - REGISTER
===================================================== */

function getLocation() {

    if (!navigator.geolocation) {
        alert("Your browser does not support location.");
        return;
    }

    const status =
        document.getElementById("locationStatus");

    status.innerText = "Detecting location...";


    navigator.geolocation.getCurrentPosition(

        position => {

            userLatitude =
                position.coords.latitude;

            userLongitude =
                position.coords.longitude;


            status.innerText =
                `✓ Location detected (${userLatitude.toFixed(5)}, ${userLongitude.toFixed(5)})`;

            status.style.color = "#15803d";

        },

        error => {

            status.innerText =
                "Location permission denied.";

            status.style.color = "#dc2626";

            alert(
                "Location permission denied.\n\n" +
                "Browser ke location permission ko Allow karo."
            );

        },

        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }

    );
}


/* =====================================================
   LOCATION - DONATION
===================================================== */

function getDonationLocation() {

    if (!navigator.geolocation) {

        alert(
            "Your browser does not support location."
        );

        return;
    }


    const status =
        document.getElementById(
            "donationLocationStatus"
        );

    status.innerText =
        "Detecting pickup location...";


    navigator.geolocation.getCurrentPosition(

        position => {

            donationLatitude =
                position.coords.latitude;

            donationLongitude =
                position.coords.longitude;


            status.innerText =
                `✓ GPS detected: ${donationLatitude.toFixed(5)}, ${donationLongitude.toFixed(5)}`;

            status.style.color = "#15803d";

        },

        error => {

            status.innerText =
                "Unable to detect location.";

            status.style.color = "#dc2626";

            alert(
                "Location access allow karo."
            );

        },

        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }

    );
}


/* =====================================================
   REGISTER
===================================================== */

async function registerUser(event) {

    event.preventDefault();


    const role =
        document.getElementById("registerRole").value;


    if (!role) {

        alert("Please select account type.");
        return;

    }


    const data = {

        name:
            document.getElementById("registerName").value,

        email:
            document.getElementById("registerEmail").value,

        password:
            document.getElementById("registerPassword").value,

        role: role,

        phone:
            document.getElementById("registerPhone").value,

        address:
            document.getElementById("registerAddress").value,

        latitude: userLatitude,

        longitude: userLongitude

    };


    if (role === "ngo") {

        data.organization_name =
            document.getElementById(
                "organizationName"
            ).value;

        data.food_capacity =
            document.getElementById(
                "foodCapacity"
            ).value;

        data.food_preference =
            document.getElementById(
                "foodPreference"
            ).value;

        data.people_served =
            document.getElementById(
                "peopleServed"
            ).value;
    }


    if (role === "driver") {

        data.vehicle_type =
            document.getElementById(
                "vehicleType"
            ).value;

        data.vehicle_number =
            document.getElementById(
                "vehicleNumber"
            ).value;
    }


    try {

        const response =
            await fetch(`${API}/register`, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(data)

            });


        const result =
            await response.json();


        if (!response.ok) {

            alert(
                result.message ||
                "Registration failed."
            );

            return;
        }


        alert(
            "Account created successfully! 🎉"
        );


        document
            .getElementById("registerForm")
            .reset();


        closeModal("registerModal");

        openLogin();


    } catch (error) {

        console.error(error);

        alert(
            "Backend server is not running.\n\n" +
            "Run: python app.py"
        );

    }

}


/* =====================================================
   LOGIN
===================================================== */

async function loginUser(event) {

    event.preventDefault();


    const email =
        document.getElementById(
            "loginEmail"
        ).value;

    const password =
        document.getElementById(
            "loginPassword"
        ).value;


    try {

        const response =
            await fetch(`${API}/login`, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email,
                    password
                })

            });


        const result =
            await response.json();


        if (!response.ok) {

            alert(
                result.message ||
                "Invalid login."
            );

            return;
        }


        currentUser = result.user;


        localStorage.setItem(
            "currentUser",
            JSON.stringify(currentUser)
        );


        closeModal("loginModal");


        updateUserUI();


        showRoleDashboard();


        alert(
            `Welcome ${currentUser.name}! 👋`
        );


    } catch (error) {

        console.error(error);

        alert(
            "Cannot connect to Flask backend.\n\n" +
            "Run python app.py"
        );

    }

}


/* =====================================================
   USER UI
===================================================== */

function updateUserUI() {

    if (!currentUser) return;


    const name =
        currentUser.name || "User";


    document.getElementById(
        "sidebarName"
    ).innerText = name;


    document.getElementById(
        "sidebarRole"
    ).innerText =
        formatRole(currentUser.role);


    document.getElementById(
        "userAvatar"
    ).innerText =
        name.charAt(0).toUpperCase();


    document
        .getElementById("logoutBtn")
        .classList.remove("hidden");

}


function formatRole(role) {

    if (role === "donor")
        return "Food Donor";

    if (role === "ngo")
        return "NGO / Shelter";

    if (role === "driver")
        return "Volunteer Driver";

    return role || "User";
}


/* =====================================================
   ROLE DASHBOARD
===================================================== */

function showRoleDashboard() {

    if (!currentUser) {

        openLogin();
        return;

    }


    document
        .getElementById("dashboard")
        .scrollIntoView({
            behavior: "smooth"
        });


    if (currentUser.role === "donor") {

        showDashboard("donor");

    }

    else if (currentUser.role === "ngo") {

        showDashboard("ngo");

    }

    else if (currentUser.role === "driver") {

        showDashboard("driver");

    }

    else {

        showDashboard("overview");

    }

}


/* =====================================================
   DASHBOARD NAVIGATION
===================================================== */

function showDashboard(view, button = null) {

    if (!currentUser) {

        openLogin();
        return;

    }


    document
        .querySelectorAll(".side-btn")
        .forEach(btn => {

            btn.classList.remove("active");

        });


    if (button) {

        button.classList.add("active");

    }

    else {

        const target =
            document.querySelector(
                `.side-btn[data-view="${view}"]`
            );

        if (target) {
            target.classList.add("active");
        }

    }


    if (view === "overview")
        loadOverview();

    else if (view === "donor")
        loadDonorDashboard();

    else if (view === "ngo")
        loadNGODashboard();

    else if (view === "driver")
        loadDriverDashboard();

    else if (view === "map")
        loadMapDashboard();

    else if (view === "impact")
        loadImpactDashboard();

}


/* =====================================================
   OVERVIEW
===================================================== */

async function loadOverview() {

    const content =
        document.getElementById(
            "dashboardContent"
        );


    content.innerHTML = `

        <div class="professional-header">

            <div>

                <span class="section-label">
                    PLATFORM OVERVIEW
                </span>

                <h2>
                    Hello, ${currentUser.name} 👋
                </h2>

                <p>
                    Your role:
                    <strong>
                        ${formatRole(currentUser.role)}
                    </strong>
                </p>

            </div>

            <button
                class="btn btn-primary"
                onclick="showRoleDashboard()">

                Open My Dashboard

            </button>

        </div>


        <div class="dashboard-grid">

            <div class="dashboard-card">

                <div class="card-icon">🍱</div>

                <h3>Total Food</h3>

                <strong id="overviewFood">
                    ...
                </strong>

                <p>KG rescued</p>

            </div>


            <div class="dashboard-card">

                <div class="card-icon">🍽️</div>

                <h3>Meals</h3>

                <strong id="overviewMeals">
                    ...
                </strong>

                <p>Estimated meals</p>

            </div>


            <div class="dashboard-card">

                <div class="card-icon">🚚</div>

                <h3>Deliveries</h3>

                <strong id="overviewDeliveries">
                    ...
                </strong>

                <p>Completed</p>

            </div>


            <div class="dashboard-card">

                <div class="card-icon">🌱</div>

                <h3>Impact</h3>

                <strong>Active</strong>

                <p>Community rescue</p>

            </div>

        </div>


        <div class="dashboard-section-card">

            <div class="section-title">

                <h3>Quick Actions</h3>

            </div>


            <div class="hero-buttons">

                ${
                    currentUser.role === "donor"
                    ?
                    `
                    <button
                        class="btn btn-primary"
                        onclick="openDonationForm()">
                        🍱 Donate Food
                    </button>
                    `
                    : ""
                }


                ${
                    currentUser.role === "ngo"
                    ?
                    `
                    <button
                        class="btn btn-primary"
                        onclick="showDashboard('ngo')">
                        🏠 Find Food
                    </button>
                    `
                    : ""
                }


                ${
                    currentUser.role === "driver"
                    ?
                    `
                    <button
                        class="btn btn-primary"
                        onclick="showDashboard('driver')">
                        🚚 View Pickups
                    </button>
                    `
                    : ""
                }

            </div>

        </div>

    `;


    loadStats();

}


/* =====================================================
   DONOR DASHBOARD
===================================================== */

function loadDonorDashboard() {

    const content =
        document.getElementById(
            "dashboardContent"
        );


    content.innerHTML = `

        <div class="professional-header">

            <div>

                <span class="section-label">
                    DONOR PORTAL
                </span>

                <h2>
                    Welcome, ${currentUser.name} 👋
                </h2>

                <p>
                    Donate surplus food and track its journey.
                </p>

            </div>


            <button
                class="btn btn-primary"
                onclick="openDonationForm()">

                + Donate Food

            </button>

        </div>


        <div class="dashboard-grid">

            <div class="dashboard-card">

                <div class="card-icon">🍱</div>

                <h3>My Donations</h3>

                <strong id="donorTotal">
                    0
                </strong>

                <p>Total posts</p>

            </div>


            <div class="dashboard-card">

                <div class="card-icon">🤝</div>

                <h3>Matched</h3>

                <strong id="donorMatched">
                    0
                </strong>

                <p>Matched donations</p>

            </div>


            <div class="dashboard-card">

                <div class="card-icon">🚚</div>

                <h3>Delivered</h3>

                <strong id="donorDelivered">
                    0
                </strong>

                <p>Successfully delivered</p>

            </div>


            <div class="dashboard-card">

                <div class="card-icon">🌱</div>

                <h3>Contribution</h3>

                <strong>Active</strong>

                <p>Reducing food waste</p>

            </div>

        </div>


        <div class="dashboard-section-card">

            <div class="section-title">

                <h3>My Recent Donations</h3>

                <button
                    class="btn btn-light"
                    onclick="loadDonations()">
                    Refresh
                </button>

            </div>


            <div id="donorDonations">
                Loading...
            </div>

        </div>

    `;


    loadDonations();

}


/* =====================================================
   DONATIONS
===================================================== */

async function loadDonations() {

    const box =
        document.getElementById(
            "donorDonations"
        );


    if (!box) return;


    try {

        const response =
            await fetch(
                `${API}/donations`
            );


        const donations =
            await response.json();


        const mine =
            donations.filter(
                d =>
                    Number(d.donor_id) ===
                    Number(currentUser.id)
            );


        document.getElementById(
            "donorTotal"
        ).innerText = mine.length;


        document.getElementById(
            "donorMatched"
        ).innerText =
            mine.filter(
                d => d.status !== "Posted"
            ).length;


        document.getElementById(
            "donorDelivered"
        ).innerText =
            mine.filter(
                d => d.status === "Delivered"
            ).length;


        if (!mine.length) {

            box.innerHTML = `

                <div class="empty-state">

                    <div>🍱</div>

                    <h3>No donations yet</h3>

                    <p>
                        Click "Donate Food" to create your first donation.
                    </p>

                </div>

            `;

            return;

        }


        box.innerHTML =
            mine.map(d => `

                <div class="food-card">

                    <div class="food-main">

                        <div class="food-icon">
                            🍱
                        </div>

                        <div>

                            <h3>
                                ${escapeHTML(d.food_name)}
                            </h3>

                            <p>
                                ${d.quantity} KG
                            </p>

                            <small>
                                📍
                                ${escapeHTML(d.location)}
                            </small>

                        </div>

                    </div>


                    <span class="status-badge">
                        ${escapeHTML(d.status)}
                    </span>

                </div>

            `).join("");


    } catch (error) {

        box.innerHTML =
            `<p>Unable to load donations.</p>`;

        console.error(error);

    }

}


/* =====================================================
   DONATION FORM
===================================================== */

function openDonationForm() {

    if (!currentUser) {

        openLogin();
        return;

    }


    if (currentUser.role !== "donor") {

        alert(
            "Only Food Donors can create donations."
        );

        return;

    }


    document.getElementById(
        "donationModal"
    ).style.display = "flex";

}


/* =====================================================
   SUBMIT DONATION
===================================================== */

async function submitDonation(event) {

    event.preventDefault();


    if (!currentUser) {

        alert("Please login first.");
        return;

    }


    if (
        donationLatitude === null ||
        donationLongitude === null
    ) {

        alert(
            "Please click 'Use Current Location' first."
        );

        return;

    }


    const data = {

        donor_id: currentUser.id,

        food_name:
            document.getElementById(
                "foodName"
            ).value,

        category:
            document.getElementById(
                "foodCategory"
            ).value,

        quantity:
            document.getElementById(
                "foodQuantity"
            ).value,

        location:
            document.getElementById(
                "foodLocation"
            ).value,

        preparation_time:
            document.getElementById(
                "preparationTime"
            ).value,

        expiry_time:
            document.getElementById(
                "expiryTime"
            ).value,

        latitude:
            donationLatitude,

        longitude:
            donationLongitude

    };


    try {

        const response =
            await fetch(
                `${API}/donations`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(data)

                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            alert(
                result.message ||
                "Donation failed."
            );

            return;

        }


        alert(
            "🎉 Food donation posted successfully!"
        );


        document
            .getElementById(
                "donationForm"
            )
            .reset();


        closeModal(
            "donationModal"
        );


        loadDonorDashboard();


    } catch (error) {

        console.error(error);

        alert(
            "Cannot connect to backend."
        );

    }

}


/* =====================================================
   NGO DASHBOARD
===================================================== */

function loadNGODashboard() {

    const content =
        document.getElementById(
            "dashboardContent"
        );


    content.innerHTML = `

        <div class="professional-header">

            <div>

                <span class="section-label">
                    NGO / SHELTER PORTAL
                </span>

                <h2>
                    ${currentUser.organization_name ||
                    currentUser.name} 🏠
                </h2>

                <p>
                    Find surplus food and manage your
                    shelter's requirements.
                </p>

            </div>

            <span class="status-badge">
                🟢 Available
            </span>

        </div>


        <div class="dashboard-grid">

            <div class="dashboard-card">

                <div class="card-icon">🍱</div>

                <h3>Available Food</h3>

                <strong id="ngoAvailable">
                    0
                </strong>

                <p>Current donations</p>

            </div>


            <div class="dashboard-card">

                <div class="card-icon">🤝</div>

                <h3>Accepted</h3>

                <strong id="ngoAccepted">
                    0
                </strong>

                <p>Food matches</p>

            </div>


            <div class="dashboard-card">

                <div class="card-icon">📦</div>

                <h3>Capacity</h3>

                <strong>
                    ${currentUser.food_capacity || 0} KG
                </strong>

                <p>Current capacity</p>

            </div>


            <div class="dashboard-card">

                <div class="card-icon">👥</div>

                <h3>People Served</h3>

                <strong>
                    ${currentUser.people_served || 0}
                </strong>

                <p>Community members</p>

            </div>

        </div>


        <div class="dashboard-section-card">

            <div class="section-title">

                <div>
                    <h3>Available Food</h3>

                    <p>
                        Donations currently available
                    </p>
                </div>

                <button
                    class="btn btn-light"
                    onclick="loadNGODonations()">
                    Refresh
                </button>

            </div>


            <div id="ngoDonations">
                Loading...
            </div>

        </div>

    `;


    loadNGODonations();

}


/* =====================================================
   NGO DONATIONS
===================================================== */

async function loadNGODonations() {

    const box =
        document.getElementById(
            "ngoDonations"
        );


    try {

        const response =
            await fetch(
                `${API}/donations`
            );


        const donations =
            await response.json();


        const available =
            donations.filter(
                d =>
                    d.status === "Posted"
            );


        document.getElementById(
            "ngoAvailable"
        ).innerText =
            available.length;


        if (!available.length) {

            box.innerHTML = `

                <div class="empty-state">

                    <div>🍽️</div>

                    <h3>
                        No food available
                    </h3>

                    <p>
                        New donations will appear here.
                    </p>

                </div>

            `;

            return;

        }


        box.innerHTML =
            available.map(d => `

                <div class="food-card">

                    <div class="food-main">

                        <div class="food-icon">
                            🍱
                        </div>

                        <div>

                            <h3>
                                ${escapeHTML(d.food_name)}
                            </h3>

                            <p>
                                ${d.quantity} KG
                            </p>

                            <small>
                                📍
                                ${escapeHTML(d.location)}
                            </small>

                            <br>

                            <small>
                                ⏰ Expires:
                                ${escapeHTML(d.expiry_time)}
                            </small>

                        </div>

                    </div>


                    <button
                        class="btn btn-primary"
                        onclick="acceptDonation(${d.id})">

                        Accept

                    </button>

                </div>

            `).join("");


    } catch (error) {

        box.innerHTML =
            "<p>Unable to load donations.</p>";

        console.error(error);

    }

}


/* =====================================================
   NGO MATCH
===================================================== */

async function acceptDonation(donationId) {

    try {

        const response =
            await fetch(
                `${API}/matches/${donationId}`,
                {
                    method: "POST"
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            alert(
                result.message ||
                "Unable to match donation."
            );

            return;

        }


        alert(
            "🤝 Donation matched successfully!"
        );


        loadNGODonations();


    } catch (error) {

        console.error(error);

        alert(
            "Matching service unavailable."
        );

    }

}


/* =====================================================
   DRIVER DASHBOARD
===================================================== */

function loadDriverDashboard() {

    const content =
        document.getElementById(
            "dashboardContent"
        );


    content.innerHTML = `

        <div class="professional-header">

            <div>

                <span class="section-label">
                    DRIVER PORTAL
                </span>

                <h2>
                    Welcome, ${currentUser.name} 🚚
                </h2>

                <p>
                    Manage your assigned food pickups.
                </p>

            </div>

            <span class="status-badge">
                🟢 Available
            </span>

        </div>


        <div class="dashboard-grid">

            <div class="dashboard-card">

                <div class="card-icon">📦</div>

                <h3>Pickups</h3>

                <strong id="driverAvailable">
                    0
                </strong>

                <p>Assigned pickups</p>

            </div>


            <div class="dashboard-card">

                <div class="card-icon">🚚</div>

                <h3>Active</h3>

                <strong id="driverActive">
                    0
                </strong>

                <p>Active deliveries</p>

            </div>


            <div class="dashboard-card">

                <div class="card-icon">✅</div>

                <h3>Completed</h3>

                <strong id="driverCompleted">
                    0
                </strong>

                <p>Completed deliveries</p>

            </div>


            <div class="dashboard-card">

                <div class="card-icon">🚗</div>

                <h3>Vehicle</h3>

                <strong>
                    ${currentUser.vehicle_type || "Not set"}
                </strong>

                <p>
                    ${currentUser.vehicle_number || ""}
                </p>

            </div>

        </div>


        <div class="dashboard-section-card">

            <div class="section-title">

                <h3>Delivery Assignments</h3>

                <button
                    class="btn btn-light"
                    onclick="loadDriverMatches()">
                    Refresh
                </button>

            </div>


            <div id="driverMatches">
                Loading...
            </div>

        </div>

    `;


    loadDriverMatches();

}


/* =====================================================
   DRIVER MATCHES
===================================================== */

async function loadDriverMatches() {

    const box =
        document.getElementById(
            "driverMatches"
        );


    try {

        const response =
            await fetch(
                `${API}/matches`
            );


        const matches =
            await response.json();


        document.getElementById(
            "driverAvailable"
        ).innerText =
            matches.length;


        document.getElementById(
            "driverActive"
        ).innerText =
            matches.filter(
                m =>
                    m.status !== "Delivered"
            ).length;


        document.getElementById(
            "driverCompleted"
        ).innerText =
            matches.filter(
                m =>
                    m.status === "Delivered"
            ).length;


        if (!matches.length) {

            box.innerHTML = `

                <div class="empty-state">

                    <div>🚚</div>

                    <h3>
                        No assignments yet
                    </h3>

                    <p>
                        New delivery assignments will appear here.
                    </p>

                </div>

            `;

            return;

        }


        box.innerHTML =
            matches.map(m => `

                <div class="food-card">

                    <div class="food-main">

                        <div class="food-icon">
                            🚚
                        </div>

                        <div>

                            <h3>
                                ${escapeHTML(
                                    m.food_name ||
                                    "Food Donation"
                                )}
                            </h3>

                            <p>
                                ${m.quantity || 0} KG
                            </p>

                            <small>
                                📍
                                ${escapeHTML(
                                    m.location ||
                                    "Pickup location"
                                )}
                            </small>

                        </div>

                    </div>


                    <button
                        class="btn btn-primary"
                        onclick="updateDeliveryStatus(
                            ${m.donation_id},
                            'Picked Up'
                        )">

                        Pick Up

                    </button>

                </div>

            `).join("");


    } catch (error) {

        console.error(error);

        box.innerHTML =
            "<p>Unable to load assignments.</p>";

    }

}


/* =====================================================
   DELIVERY STATUS
===================================================== */

async function updateDeliveryStatus(
    donationId,
    status
) {

    try {

        const response =
            await fetch(
                `${API}/donations/${donationId}/status`,
                {

                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            status: status
                        })

                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            alert(
                result.message ||
                "Unable to update status."
            );

            return;

        }


        alert(
            `Status updated: ${status}`
        );


        loadDriverMatches();


    } catch (error) {

        console.error(error);

        alert(
            "Status update failed."
        );

    }

}


/* =====================================================
   MAP DASHBOARD
===================================================== */

function loadMapDashboard() {

    const content =
        document.getElementById(
            "dashboardContent"
        );


    content.innerHTML = `

        <div class="professional-header">

            <div>

                <span class="section-label">
                    LIVE LOCATION
                </span>

                <h2>
                    Food Rescue Map 📍
                </h2>

                <p>
                    View available food rescue locations.
                </p>

            </div>

        </div>


        <div
            id="map"
            style="
                height:500px;
                border-radius:18px;
                overflow:hidden;
                background:#e2e8f0;
            ">
        </div>

    `;


    setTimeout(
        loadMapMarkers,
        100
    );

}


/* =====================================================
   MAP
===================================================== */

async function loadMapMarkers() {

    const mapElement =
        document.getElementById("map");


    if (!mapElement) return;


    if (typeof L === "undefined") {

        mapElement.innerHTML =
            "<p style='padding:20px'>Map library loading...</p>";

        return;

    }


    const map =
        L.map("map").setView(
            [26.9124, 75.7873],
            12
        );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(map);


    try {

        const response =
            await fetch(
                `${API}/donations`
            );


        const donations =
            await response.json();


        donations.forEach(d => {

            if (
                d.latitude &&
                d.longitude
            ) {

                L.marker([
                    d.latitude,
                    d.longitude
                ])
                .addTo(map)
                .bindPopup(`
                    <strong>
                        ${escapeHTML(d.food_name)}
                    </strong>
                    <br>
                    ${d.quantity} KG
                    <br>
                    ${escapeHTML(d.location)}
                `);

            }

        });


    } catch (error) {

        console.error(error);

    }

}


/* =====================================================
   IMPACT
===================================================== */

async function loadImpactDashboard() {

    const content =
        document.getElementById(
            "dashboardContent"
        );


    content.innerHTML = `

        <div class="professional-header">

            <div>

                <span class="section-label">
                    SOCIAL IMPACT
                </span>

                <h2>
                    Our Community Impact 🌱
                </h2>

                <p>
                    See how much food has been rescued through the platform.
                </p>

            </div>

        </div>


        <div class="dashboard-grid">

            <div class="dashboard-card">

                <div class="card-icon">🌾</div>

                <h3>Food Rescued</h3>

                <strong id="dashboardImpactFood">
                    0 KG
                </strong>

            </div>


            <div class="dashboard-card">

                <div class="card-icon">🍽️</div>

                <h3>Meals</h3>

                <strong id="dashboardImpactMeals">
                    0
                </strong>

            </div>


            <div class="dashboard-card">

                <div class="card-icon">🚚</div>

                <h3>Deliveries</h3>

                <strong id="dashboardImpactDeliveries">
                    0
                </strong>

            </div>


            <div class="dashboard-card">

                <div class="card-icon">🌍</div>

                <h3>Mission</h3>

                <strong>Active</strong>

            </div>

        </div>

    `;


    loadStats();

}


/* =====================================================
   STATS
===================================================== */

async function loadStats() {

    try {

        const response =
            await fetch(
                `${API}/stats`
            );


        const stats =
            await response.json();


        const food =
            stats.food_rescued ||
            stats.total_food ||
            0;


        const meals =
            stats.meals_rescued ||
            stats.total_meals ||
            0;


        const deliveries =
            stats.total_deliveries ||
            stats.deliveries ||
            0;


        setText(
            "heroFood",
            food
        );

        setText(
            "heroMeals",
            meals
        );

        setText(
            "heroDeliveries",
            deliveries
        );


        setText(
            "impactFood",
            `${food} kg`
        );

        setText(
            "impactMeals",
            meals
        );

        setText(
            "impactDeliveries",
            deliveries
        );


        setText(
            "overviewFood",
            `${food} KG`
        );

        setText(
            "overviewMeals",
            meals
        );

        setText(
            "overviewDeliveries",
            deliveries
        );


        setText(
            "dashboardImpactFood",
            `${food} KG`
        );

        setText(
            "dashboardImpactMeals",
            meals
        );

        setText(
            "dashboardImpactDeliveries",
            deliveries
        );


    } catch (error) {

        console.error(
            "Stats error:",
            error
        );

    }

}


/* =====================================================
   LOGOUT
===================================================== */

function logout() {

    localStorage.removeItem(
        "currentUser"
    );

    currentUser = null;

    location.reload();

}


/* =====================================================
   HELPERS
===================================================== */

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.innerText = value;
    }

}


function scrollToSection(id) {

    const element =
        document.getElementById(id);

    if (element) {

        element.scrollIntoView({
            behavior: "smooth"
        });

    }

}


function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =====================================================
   FORM EVENTS
===================================================== */

document
    .getElementById("loginForm")
    .addEventListener(
        "submit",
        loginUser
    );


document
    .getElementById("registerForm")
    .addEventListener(
        "submit",
        registerUser
    );


document
    .getElementById("donationForm")
    .addEventListener(
        "submit",
        submitDonation
    );


/* =====================================================
   STARTUP
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        updateUserUI();

        loadStats();


        if (currentUser) {

            showRoleDashboard();

        }

    }
);