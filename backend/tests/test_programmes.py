from app.models.university import University
from app.models.programme import Programme

def test_get_universities_empty(client):
    response = client.get("/api/v1/universities/")
    assert response.status_code == 200
    assert response.json() == []

def test_get_programmes(client, db_session):
    # Seed a university and programme
    uni = University(name="Test Uni", location="Test City", institution_type="University")
    db_session.add(uni)
    db_session.commit()

    prog = Programme(
        university_id=uni.id,
        name="Test MSc",
        degree_type="M.Sc.",
        nc_status="NC_FREE",
        application_route="Direct",
        application_fee_eur=50.0,
        gre_required="Not Required"
    )
    db_session.add(prog)
    db_session.commit()

    response = client.get("/api/v1/programmes/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Test MSc"

def test_filter_programmes_by_nc_status(client, db_session):
    response = client.get("/api/v1/programmes/?nc_status=NC_FREE")
    assert response.status_code == 200

def test_filter_programmes_by_gre(client, db_session):
    response = client.get("/api/v1/programmes/?gre_required=Mandatory")
    assert response.status_code == 200
