from datetime import datetime
import pytest
from models import User, Group, Event, RSVP, GroupInvitation, EventInvitation, Comment
from config import db

def create_user(username, email, password):
    """Helper function to create and return a user."""
    user = User(username=username, email=email)
    user.password = password
    db.session.add(user)
    db.session.commit()
    return user

@pytest.mark.usefixtures("test_client")
class TestModels:
    def setup_method(self):
        """Rollback session to clean up state before each test."""
        db.session.rollback()

    def teardown_method(self):
        """Rollback session to clean up state after each test."""
        db.session.rollback()

    def test_user_creation(self):
        """Test User creation and password hashing."""
        user = create_user("testuser", "test@example.com", "Password123")
        fetched_user = User.query.filter_by(username="testuser").first()
        assert fetched_user is not None
        assert fetched_user.check_password("Password123") is True

    def test_event_creation_and_invitation(self):
        """Test Event creation and user invitations."""
        user = create_user("event_creator", "event_creator@example.com", "Password123")
        event_date = datetime.strptime("2024-01-01", "%Y-%m-%d")  # Convert string to datetime
        event = Event(name="Test Event", date=event_date, location="Test Location",
                      description="Test Description", user_id=user.id)
        db.session.add(event)
        db.session.commit()

        fetched_event = Event.query.filter_by(name="Test Event").first()
        assert fetched_event is not None
        assert fetched_event.user.username == "event_creator"

    def test_event_invitation(self):
        """Test EventInvitation logic."""
        user1 = create_user("event_inviter", "event_inviter@example.com", "Password123")
        user2 = create_user("event_invitee", "event_invitee@example.com", "Password123")
        event_date = datetime.strptime("2024-01-01", "%Y-%m-%d")  # Convert string to datetime
        event = Event(name="Invite Event", date=event_date, location="Test Location",
                      description="Invite Test", user_id=user1.id)
        db.session.add(event)
        db.session.commit()

        invitation = EventInvitation(event_id=event.id, inviter_id=user1.id,
                                     invitee_id=user2.id, status="pending")
        db.session.add(invitation)
        db.session.commit()

        assert invitation.status == "pending"

        invitation.accept()
        assert invitation.status == "Accepted"

    def test_rsvp_creation(self):
        """Test RSVP creation."""
        user = create_user("rsvp_user", "rsvp_user@example.com", "Password123")
        event_date = datetime.strptime("2024-01-01", "%Y-%m-%d")  # Convert string to datetime
        event = Event(name="RSVP Event", date=event_date, location="Test Location",
                      description="RSVP Test", user_id=user.id)
        db.session.add(event)
        db.session.commit()

        rsvp = RSVP(user_id=user.id, event_id=event.id, status="Attending")
        db.session.add(rsvp)
        db.session.commit()

        fetched_rsvp = RSVP.query.first()
        assert fetched_rsvp is not None
        assert fetched_rsvp.status == "Attending"

    def test_comment_creation(self):
        """Test Comment creation."""
        user = create_user("comment_user", "comment_user@example.com", "Password123")
        event_date = datetime.strptime("2024-01-01", "%Y-%m-%d")  # Convert string to datetime
        event = Event(name="Comment Event", date=event_date, location="Test Location",
                      description="Comment Test", user_id=user.id)
        db.session.add(event)
        db.session.commit()

        comment = Comment(content="Great event!", user_id=user.id, event_id=event.id)
        db.session.add(comment)
        db.session.commit()

        fetched_comment = Comment.query.first()
        assert fetched_comment is not None
        assert fetched_comment.content == "Great event!"
