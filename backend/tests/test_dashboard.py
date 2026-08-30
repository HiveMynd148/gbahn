from app.models.university import University
from app.models.programme import Programme

def test_add_programme_to_dashboard(client, db_session):
    # Register and login
    client.post("/api/v1/auth/register", json={"email": "dash@example.com", "username": "dashuser", "password": "password123"})
    login_res = client.post("/api/v1/auth/login", data={"username": "dash@example.com", "password": "password123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create a programme
    uni = University(name="Dash Uni", location="Dash City", institution_type="University")
    db_session.add(uni)
    db_session.commit()

    prog = Programme(
        university_id=uni.id,
        name="Dash MSc",
        degree_type="M.Sc.",
        nc_status="NC_FREE",
        application_route="Direct",
        application_fee_eur=0.0,
        gre_required="Not Required"
    )
    db_session.add(prog)
    db_session.commit()

    # Add to dashboard
    response = client.post(
        "/api/v1/dashboard/programmes",
        json={"programme_id": str(prog.id)},
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["programme_id"] == str(prog.id)

    # Verify it is in the dashboard
    get_res = client.get("/api/v1/dashboard/", headers=headers)
    assert len(get_res.json()["dashboard_programmes"]) == 1
