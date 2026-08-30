def test_register_user(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "username": "testuser", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data

def test_register_duplicate_email(client):
    client.post(
        "/api/v1/auth/register",
        json={"email": "test2@example.com", "username": "testuser2", "password": "password123"}
    )
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "test2@example.com", "username": "testuser3", "password": "password123"}
    )
    assert response.status_code == 400

def test_login_user(client):
    client.post(
        "/api/v1/auth/register",
        json={"email": "login@example.com", "username": "loginuser", "password": "password123"}
    )
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "login@example.com", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data

def test_access_protected_route_without_token(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401

def test_access_protected_route_with_token(client):
    client.post(
        "/api/v1/auth/register",
        json={"email": "me@example.com", "username": "meuser", "password": "password123"}
    )
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "me@example.com", "password": "password123"}
    )
    token = login_res.json()["access_token"]
    
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["username"] == "meuser"
