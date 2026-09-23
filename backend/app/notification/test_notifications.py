"""Verification test suite for notification system."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _login(email: str, password: str = "Learner@123") -> str:
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    data = res.json()
    return data.get("accessToken") or data.get("token")


def test_learner_notifications():
    token = _login("samiur@eclassroompro.com", "Learner@123")
    res = client.get("/api/notifications", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "unreadCount" in data
    assert len(data["items"]) > 0

    # Test marking as read
    first = data["items"][0]
    res_read = client.patch(
        f"/api/notifications/{first['id']}/read",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_read.status_code == 200
    assert res_read.json()["isRead"] is True


def test_instructor_notifications():
    token = _login("mahbubur@eclassroompro.com", "Instructor@123")
    res = client.get("/api/notifications", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "unreadCount" in data


def test_admin_notifications():
    token = _login("admin@eclassroompro.com", "Admin@123")
    res = client.get("/api/notifications", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    # Admin should not see other users' private grades as personal notifications
    kinds = [n["kind"] for n in data["items"]]
    assert "grade" not in kinds


def test_idor_security_access_control():
    """Verify user cannot read, mark read, or delete another user's notifications."""
    learner_token = _login("samiur@eclassroompro.com", "Learner@123")
    instructor_token = _login("abdul@eclassroompro.com", "Instructor@123")

    # Get instructor's notification id
    res_t = client.get("/api/notifications", headers={"Authorization": f"Bearer {instructor_token}"})
    assert res_t.status_code == 200
    instructor_notif = res_t.json()["items"][0]

    # Learner attempts to mark instructor's notification as read
    res_hack = client.patch(
        f"/api/notifications/{instructor_notif['id']}/read",
        headers={"Authorization": f"Bearer {learner_token}"},
    )
    assert res_hack.status_code == 403, f"Expected 403 Forbidden, got {res_hack.status_code}"

    # Learner attempts to delete instructor's notification
    res_del = client.delete(
        f"/api/notifications/{instructor_notif['id']}",
        headers={"Authorization": f"Bearer {learner_token}"},
    )
    assert res_del.status_code == 403, f"Expected 403 Forbidden, got {res_del.status_code}"


def test_notification_preferences():
    token = _login("samiur@eclassroompro.com", "Learner@123")
    res = client.get("/api/notifications/preferences", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    pref = res.json()
    assert "emailNotifications" in pref
    assert "assignmentNotifications" in pref

    # Update preference
    res_up = client.put(
        "/api/notifications/preferences",
        headers={"Authorization": f"Bearer {token}"},
        json={**pref, "announcementNotifications": False},
    )
    assert res_up.status_code == 200
    assert res_up.json()["announcementNotifications"] is False

    # Restore
    client.put(
        "/api/notifications/preferences",
        headers={"Authorization": f"Bearer {token}"},
        json={**pref, "announcementNotifications": True},
    )


def test_mark_all_read():
    token = _login("ratin@eclassroompro.com", "Learner@123")
    res = client.post("/api/notifications/read-all", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_event_triggers():
    instructor_token = _login("mahbubur@eclassroompro.com", "Instructor@123")
    learner_token = _login("samiur@eclassroompro.com", "Learner@123")

    # 1. Instructor creates an announcement in Course 1
    res_ann = client.post(
        "/api/announcements",
        headers={"Authorization": f"Bearer {instructor_token}"},
        json={"courseId": 1, "title": "Test Notice: Final Project Discussion", "body": "Please read carefully."},
    )
    assert res_ann.status_code == 201, f"Announcement creation failed: {res_ann.status_code} {res_ann.text}"

    # Verify learner Samiur received the announcement notification
    res_s_notifs = client.get("/api/notifications", headers={"Authorization": f"Bearer {learner_token}"})
    assert res_s_notifs.status_code == 200
    ann_notifs = [n for n in res_s_notifs.json()["items"] if "Final Project Discussion" in n["title"] or "Final Project Discussion" in n["message"]]
    assert len(ann_notifs) > 0, "Learner did not receive announcement notification"


def test_sse_stream():
    from app.notification.broadcaster import notification_broadcaster

    # 1. Unauthorized request without token
    res_unauth = client.get("/api/notifications/stream")
    assert res_unauth.status_code == 401

    # 2. Invalid token
    res_bad = client.get("/api/notifications/stream?token=invalid.jwt.token")
    assert res_bad.status_code == 401

    # 3. Test Broadcaster Pub/Sub & strict user isolation
    user_a_id = 9988
    user_b_id = 9989

    queue_a = notification_broadcaster.connect(user_a_id)
    queue_b = notification_broadcaster.connect(user_b_id)

    assert notification_broadcaster.get_subscriber_count(user_a_id) == 1
    assert notification_broadcaster.get_subscriber_count(user_b_id) == 1

    # Publish to User A
    event_a = {"id": 101, "title": "Assignment Due", "kind": "assignment"}
    notification_broadcaster.publish(user_a_id, event_a)

    # User A must receive it
    assert not queue_a.empty()
    received = queue_a.get_nowait()
    assert received["title"] == "Assignment Due"

    # User B must NOT receive User A's notification (User isolation / IDOR check)
    assert queue_b.empty(), "User B should not receive User A's notification"

    # Cleanup
    notification_broadcaster.disconnect(user_a_id, queue_a)
    notification_broadcaster.disconnect(user_b_id, queue_b)
    assert notification_broadcaster.get_subscriber_count(user_a_id) == 0
    assert notification_broadcaster.get_subscriber_count(user_b_id) == 0


if __name__ == "__main__":
    print("Running test_learner_notifications...")
    test_learner_notifications()
    print("✓ test_learner_notifications passed")

    print("Running test_instructor_notifications...")
    test_instructor_notifications()
    print("✓ test_instructor_notifications passed")

    print("Running test_admin_notifications...")
    test_admin_notifications()
    print("✓ test_admin_notifications passed")

    print("Running test_idor_security_access_control...")
    test_idor_security_access_control()
    print("✓ test_idor_security_access_control passed")

    print("Running test_notification_preferences...")
    test_notification_preferences()
    print("✓ test_notification_preferences passed")

    print("Running test_mark_all_read...")
    test_mark_all_read()
    print("✓ test_mark_all_read passed")

    print("Running test_event_triggers...")
    test_event_triggers()
    print("✓ test_event_triggers passed")

    print("Running test_sse_stream...")
    test_sse_stream()
    print("✓ test_sse_stream passed")

    print("\n✅ All notification test suites passed successfully!")

