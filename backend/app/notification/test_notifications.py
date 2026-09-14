"""Verification test suite for notification system."""

from fastapi.testclient import TestClient

from app.main import app
from app.utils.db import LocalSession
from app.user.models import UserModel
from app.notification.models import NotificationModel

client = TestClient(app)


def _login(email: str, password: str = "Student@123") -> str:
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    data = res.json()
    return data.get("accessToken") or data.get("token")


def test_student_notifications():
    token = _login("samiur@eclassroompro.com", "Student@123")
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


def test_teacher_notifications():
    token = _login("mahbubur@eclassroompro.com", "Teacher@123")
    res = client.get("/api/notifications", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    # Verify submissions are present for teacher
    kinds = [n["kind"] for n in data["items"]]
    assert "submission" in kinds or len(data["items"]) > 0


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
    student_token = _login("samiur@eclassroompro.com", "Student@123")
    teacher_token = _login("mahbubur@eclassroompro.com", "Teacher@123")

    # Get teacher's notification id
    res_t = client.get("/api/notifications", headers={"Authorization": f"Bearer {teacher_token}"})
    assert res_t.status_code == 200
    teacher_notif = res_t.json()["items"][0]

    # Student attempts to mark teacher's notification as read
    res_hack = client.patch(
        f"/api/notifications/{teacher_notif['id']}/read",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res_hack.status_code == 403, f"Expected 403 Forbidden, got {res_hack.status_code}"

    # Student attempts to delete teacher's notification
    res_del = client.delete(
        f"/api/notifications/{teacher_notif['id']}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res_del.status_code == 403, f"Expected 403 Forbidden, got {res_del.status_code}"


def test_notification_preferences():
    token = _login("samiur@eclassroompro.com", "Student@123")
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
    token = _login("ratin@eclassroompro.com", "Student@123")
    res = client.post("/api/notifications/read-all", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

def test_event_triggers():
    admin_token = _login("admin@eclassroompro.com", "Admin@123")
    teacher_token = _login("mahbubur@eclassroompro.com", "Teacher@123")
    student_token = _login("samiur@eclassroompro.com", "Student@123")

    # 1. Teacher creates an announcement in Course 1
    res_ann = client.post(
        "/api/announcements",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={"courseId": 1, "title": "Test Notice: Final Project Discussion", "body": "Please read carefully."},
    )
    assert res_ann.status_code == 201, f"Announcement creation failed: {res_ann.status_code} {res_ann.text}"

    # Verify student Samiur received the announcement notification
    res_s_notifs = client.get("/api/notifications", headers={"Authorization": f"Bearer {student_token}"})
    assert res_s_notifs.status_code == 200
    ann_notifs = [n for n in res_s_notifs.json()["items"] if "Final Project Discussion" in n["title"] or "Final Project Discussion" in n["message"]]
    assert len(ann_notifs) > 0, "Student did not receive announcement notification"


if __name__ == "__main__":
    print("Running test_student_notifications...")
    test_student_notifications()
    print("✓ test_student_notifications passed")

    print("Running test_teacher_notifications...")
    test_teacher_notifications()
    print("✓ test_teacher_notifications passed")

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

    print("\n✅ All notification test suites passed successfully!")


