from flask import Flask, request, jsonify
from flask_cors import CORS
from database import get_db, init_db
import math

app = Flask(__name__)
CORS(app)

init_db()


# =====================================================
# HELPERS
# =====================================================

def distance_km(lat1, lon1, lat2, lon2):

    if None in (lat1, lon1, lat2, lon2):
        return None

    R = 6371

    p1 = math.radians(lat1)
    p2 = math.radians(lat2)

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(p1)
        * math.cos(p2)
        * math.sin(dlon / 2) ** 2
    )

    return round(
        R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)),
        2
    )


def user_dict(row):

    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "role": row["role"],
        "phone": row["phone"],
        "address": row["address"],
        "latitude": row["latitude"],
        "longitude": row["longitude"],
        "organization_name": row["organization_name"],
        "food_capacity": row["food_capacity"],
        "food_preference": row["food_preference"],
        "people_served": row["people_served"],
        "vehicle_type": row["vehicle_type"],
        "vehicle_number": row["vehicle_number"],
        "available": row["available"]
    }


# =====================================================
# BASIC
# =====================================================

@app.route("/")
def home():
    return jsonify({
        "message": "SurplusToShelter Backend Running"
    })


@app.route("/api/test")
def test():
    return jsonify({
        "message": "Backend connected successfully"
    })


# =====================================================
# REGISTER
# =====================================================

@app.route("/api/register", methods=["POST"])
def register():

    data = request.get_json() or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    role = data.get("role", "donor")

    if not name or not email or not password:
        return jsonify({
            "success": False,
            "message": "Name, email and password are required"
        }), 400

    conn = get_db()

    try:

        cursor = conn.execute("""
            INSERT INTO users (
                name,
                email,
                password,
                role,
                phone,
                address,
                latitude,
                longitude,
                organization_name,
                food_capacity,
                food_preference,
                people_served,
                vehicle_type,
                vehicle_number
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (

            name,
            email,
            password,
            role,

            data.get("phone"),
            data.get("address"),

            data.get("latitude"),
            data.get("longitude"),

            data.get("organization_name"),
            data.get("food_capacity", 0),
            data.get("food_preference"),
            data.get("people_served", 0),

            data.get("vehicle_type"),
            data.get("vehicle_number")
        ))

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Registration successful",
            "user_id": cursor.lastrowid
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 400

    finally:
        conn.close()


# =====================================================
# LOGIN
# =====================================================

@app.route("/api/login", methods=["POST"])
def login():

    data = request.get_json() or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    conn = get_db()

    user = conn.execute("""
        SELECT *
        FROM users
        WHERE email = ?
        AND password = ?
    """, (email, password)).fetchone()

    conn.close()

    if not user:

        return jsonify({
            "success": False,
            "message": "Invalid email or password"
        }), 401

    return jsonify({
        "success": True,
        "message": "Login successful",
        "user": user_dict(user)
    })


# =====================================================
# USERS / MAP
# =====================================================

@app.route("/api/users", methods=["GET"])
def users():

    role = request.args.get("role")

    conn = get_db()

    if role:

        rows = conn.execute("""
            SELECT *
            FROM users
            WHERE role = ?
        """, (role,)).fetchall()

    else:

        rows = conn.execute("""
            SELECT *
            FROM users
        """).fetchall()

    conn.close()

    return jsonify([
        user_dict(row)
        for row in rows
    ])


# =====================================================
# DONATION CREATE
# =====================================================

@app.route("/api/donations", methods=["POST"])
def create_donation():

    data = request.get_json() or {}

    donor_id = data.get("donor_id")

    if not donor_id:
        return jsonify({
            "success": False,
            "message": "Donor login required"
        }), 401

    required = [
        "food_name",
        "quantity",
        "location",
        "expiry_time"
    ]

    for field in required:

        if not data.get(field):

            return jsonify({
                "success": False,
                "message": f"{field} is required"
            }), 400

    conn = get_db()

    cursor = conn.execute("""
        INSERT INTO donations (
            donor_id,
            food_name,
            category,
            quantity,
            location,
            latitude,
            longitude,
            preparation_time,
            expiry_time
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (

        donor_id,
        data.get("food_name"),
        data.get("category"),
        data.get("quantity"),

        data.get("location"),
        data.get("latitude"),
        data.get("longitude"),

        data.get("preparation_time"),
        data.get("expiry_time")
    ))

    conn.commit()

    donation_id = cursor.lastrowid

    conn.close()

    return jsonify({
        "success": True,
        "message": "Food donation posted successfully",
        "donation_id": donation_id
    })


# =====================================================
# GET DONATIONS
# =====================================================

@app.route("/api/donations", methods=["GET"])
def get_donations():

    donor_id = request.args.get("donor_id")
    status = request.args.get("status")

    conn = get_db()

    query = """
        SELECT
            d.*,
            u.name AS donor_name
        FROM donations d
        LEFT JOIN users u
        ON d.donor_id = u.id
        WHERE 1=1
    """

    params = []

    if donor_id:

        query += " AND d.donor_id = ?"
        params.append(donor_id)

    if status:

        query += " AND d.status = ?"
        params.append(status)

    query += " ORDER BY d.id DESC"

    rows = conn.execute(query, params).fetchall()

    conn.close()

    return jsonify([
        dict(row)
        for row in rows
    ])


# =====================================================
# FIND NEAREST NGO
# =====================================================

@app.route("/api/matches/<int:donation_id>", methods=["POST"])
def match_donation(donation_id):

    conn = get_db()

    donation = conn.execute("""
        SELECT *
        FROM donations
        WHERE id = ?
    """, (donation_id,)).fetchone()

    if not donation:

        conn.close()

        return jsonify({
            "success": False,
            "message": "Donation not found"
        }), 404

    ngos = conn.execute("""
        SELECT *
        FROM users
        WHERE role = 'ngo'
        AND available = 1
    """).fetchall()

    if not ngos:

        conn.close()

        return jsonify({
            "success": False,
            "message": "No available NGO found"
        }), 404

    best_ngo = None
    best_distance = None

    for ngo in ngos:

        dist = distance_km(
            donation["latitude"],
            donation["longitude"],
            ngo["latitude"],
            ngo["longitude"]
        )

        if dist is None:
            continue

        if ngo["food_capacity"] < donation["quantity"]:
            continue

        if best_distance is None or dist < best_distance:

            best_distance = dist
            best_ngo = ngo

    if not best_ngo:

        conn.close()

        return jsonify({
            "success": False,
            "message": "No suitable nearby NGO found"
        }), 404

    score = max(0, round(100 - best_distance * 5, 2))

    cursor = conn.execute("""
        INSERT INTO matches (
            donation_id,
            ngo_id,
            distance_km,
            match_score
        )
        VALUES (?, ?, ?, ?)
    """, (
        donation_id,
        best_ngo["id"],
        best_distance,
        score
    ))

    match_id = cursor.lastrowid

    conn.execute("""
        UPDATE donations
        SET
            matched_ngo_id = ?,
            status = 'Matched'
        WHERE id = ?
    """, (
        best_ngo["id"],
        donation_id
    ))

    conn.commit()

    conn.close()

    return jsonify({
        "success": True,
        "message": "Donation matched with nearby NGO",
        "match_id": match_id,
        "ngo": user_dict(best_ngo),
        "distance_km": best_distance,
        "match_score": score
    })


# =====================================================
# MATCHES
# =====================================================

@app.route("/api/matches", methods=["GET"])
def get_matches():

    conn = get_db()

    rows = conn.execute("""
        SELECT
            m.*,

            d.food_name,
            d.quantity,
            d.location,
            d.expiry_time,

            donor.name AS donor_name,

            ngo.name AS ngo_name,
            ngo.organization_name AS organization_name,

            driver.name AS driver_name

        FROM matches m

        JOIN donations d
        ON m.donation_id = d.id

        LEFT JOIN users donor
        ON d.donor_id = donor.id

        LEFT JOIN users ngo
        ON m.ngo_id = ngo.id

        LEFT JOIN users driver
        ON m.driver_id = driver.id

        ORDER BY m.id DESC
    """).fetchall()

    conn.close()

    return jsonify([
        dict(row)
        for row in rows
    ])


# =====================================================
# NGO ACCEPT DONATION
# =====================================================

@app.route("/api/matches/<int:match_id>/accept", methods=["PUT"])
def accept_match(match_id):

    data = request.get_json() or {}

    ngo_id = data.get("ngo_id")

    conn = get_db()

    match = conn.execute("""
        SELECT *
        FROM matches
        WHERE id = ?
    """, (match_id,)).fetchone()

    if not match:

        conn.close()

        return jsonify({
            "success": False,
            "message": "Match not found"
        }), 404

    conn.execute("""
        UPDATE matches
        SET
            ngo_id = ?,
            status = 'Accepted'
        WHERE id = ?
    """, (
        ngo_id,
        match_id
    ))

    conn.execute("""
        UPDATE donations
        SET status = 'Accepted'
        WHERE id = ?
    """, (
        match["donation_id"],
    ))

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Donation accepted"
    })


# =====================================================
# ASSIGN DRIVER
# =====================================================

@app.route("/api/matches/<int:match_id>/driver", methods=["PUT"])
def assign_driver(match_id):

    data = request.get_json() or {}

    driver_id = data.get("driver_id")

    conn = get_db()

    match = conn.execute("""
        SELECT *
        FROM matches
        WHERE id = ?
    """, (match_id,)).fetchone()

    if not match:

        conn.close()

        return jsonify({
            "success": False,
            "message": "Match not found"
        }), 404

    conn.execute("""
        UPDATE matches
        SET
            driver_id = ?,
            status = 'Driver Assigned'
        WHERE id = ?
    """, (
        driver_id,
        match_id
    ))

    conn.execute("""
        UPDATE donations
        SET
            driver_id = ?,
            status = 'Driver Assigned'
        WHERE id = ?
    """, (
        driver_id,
        match["donation_id"]
    ))

    conn.execute("""
        UPDATE users
        SET available = 0
        WHERE id = ?
    """, (
        driver_id,
    ))

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Driver assigned successfully"
    })


# =====================================================
# DELIVERY STATUS
# =====================================================

@app.route("/api/donations/<int:donation_id>/status", methods=["PUT"])
def update_status(donation_id):

    data = request.get_json() or {}

    status = data.get("status")

    allowed = [
        "Posted",
        "Matched",
        "Accepted",
        "Driver Assigned",
        "Picked Up",
        "In Transit",
        "Delivered"
    ]

    if status not in allowed:

        return jsonify({
            "success": False,
            "message": "Invalid status"
        }), 400

    conn = get_db()

    conn.execute("""
        UPDATE donations
        SET status = ?
        WHERE id = ?
    """, (
        status,
        donation_id
    ))

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": f"Status updated to {status}"
    })


# =====================================================
# STATS
# =====================================================

@app.route("/api/stats")
def stats():

    conn = get_db()

    total_food = conn.execute("""
        SELECT COALESCE(SUM(quantity), 0)
        FROM donations
        WHERE status = 'Delivered'
    """).fetchone()[0]

    active = conn.execute("""
        SELECT COUNT(*)
        FROM donations
        WHERE status != 'Delivered'
    """).fetchone()[0]

    deliveries = conn.execute("""
        SELECT COUNT(*)
        FROM donations
        WHERE status = 'Delivered'
    """).fetchone()[0]

    ngos = conn.execute("""
        SELECT COUNT(*)
        FROM users
        WHERE role = 'ngo'
    """).fetchone()[0]

    drivers = conn.execute("""
        SELECT COUNT(*)
        FROM users
        WHERE role = 'driver'
    """).fetchone()[0]

    conn.close()

    meals = round(total_food * 2.5, 2)

    return jsonify({
        "food_rescued": total_food,
        "meals_rescued": meals,
        "active_donations": active,
        "total_deliveries": deliveries,
        "total_ngos": ngos,
        "total_drivers": drivers
    })


# =====================================================
# START
# =====================================================

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )