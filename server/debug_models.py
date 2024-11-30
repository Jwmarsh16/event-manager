from models import GroupInvitation, User, Event, Group, RSVP, Comment
from config import app, db  # Assuming you have an app in config.py

# Initialize the app context for SQLAlchemy
with app.app_context():
    # Fetch and test each model
    print("Testing GroupInvitation model:")
    try:
        invitation = GroupInvitation.query.first()
        if invitation:
            print("Serialized GroupInvitation:", invitation.to_dict())
        else:
            print("No GroupInvitation records found.")
    except Exception as e:
        print("Error with GroupInvitation:", e)

    print("\nTesting User model:")
    try:
        user = User.query.first()
        if user:
            print("Serialized User:", user.to_dict())
        else:
            print("No User records found.")
    except Exception as e:
        print("Error with User:", e)

    print("\nTesting Event model:")
    try:
        event = Event.query.first()
        if event:
            print("Serialized Event:", event.to_dict())
        else:
            print("No Event records found.")
    except Exception as e:
        print("Error with Event:", e)

    print("\nTesting Group model:")
    try:
        group = Group.query.first()
        if group:
            print("Serialized Group:", group.to_dict())
        else:
            print("No Group records found.")
    except Exception as e:
        print("Error with Group:", e)

    print("\nTesting RSVP model:")
    try:
        rsvp = RSVP.query.first()
        if rsvp:
            print("Serialized RSVP:", rsvp.to_dict())
        else:
            print("No RSVP records found.")
    except Exception as e:
        print("Error with RSVP:", e)

    print("\nTesting Comment model:")
    try:
        comment = Comment.query.first()
        if comment:
            print("Serialized Comment:", comment.to_dict())
        else:
            print("No Comment records found.")
    except Exception as e:
        print("Error with Comment:", e)
