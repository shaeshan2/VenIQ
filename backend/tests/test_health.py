from app import create_app


def test_health_endpoint_returns_ok():
    app = create_app()
    app.config["TESTING"] = True

    with app.test_client() as client:
        res = client.get("/api/health")

    assert res.status_code == 200
    assert res.get_json() == {"status": "ok"}
