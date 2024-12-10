from faker import Faker
from config import app, db
from models import User, Event, Group, RSVP, Comment, GroupInvitation, EventInvitation
import random
from datetime import datetime, timezone

# Initialize Faker
fake = Faker()

def seed_users(num_users=10):
    users = []
    for _ in range(num_users):
        user = User(
            username=fake.user_name(),
            email=fake.email(),
            password=fake.password(),  # This will be hashed in the User model
        )
        db.session.add(user)
        users.append(user)
    db.session.commit()
    return users

def seed_groups(users, num_groups=5):
    groups = []
    for _ in range(num_groups):
        group = Group(
            name=fake.word(),
            description=fake.sentence(),
            user_id=random.choice(users).id,
        )
        db.session.add(group)
        groups.append(group)
    db.session.commit()
    return groups


def seed_group_members(users, groups, num_members_per_group=5):
    """
    Seed group members by associating users with groups.
    Each group will have a random number of members up to num_members_per_group.
    """
    for group in groups:
        # Randomly select users to add as members of the group
        members = random.sample(users, min(num_members_per_group, len(users)))
        for member in members:
            group.members.append(member)  # Use SQLAlchemy relationship to append members
    db.session.commit()
    print("Group members seeded successfully!")



def seed_events(users, num_events=10):
    events = []
    for _ in range(num_events):
        event = Event(
            name=fake.catch_phrase(),
            date=fake.date_this_year(),
            location=fake.city(),
            description=fake.paragraph(),
            user_id=random.choice(users).id,
        )
        db.session.add(event)
        events.append(event)
    db.session.commit()
    return events

def seed_rsvps(users, events, num_rsvps=20):
    for _ in range(num_rsvps):
        rsvp = RSVP(
            user_id=random.choice(users).id,
            event_id=random.choice(events).id,
            status=random.choice(['Confirmed', 'Declined', 'maybe']),
        )
        db.session.add(rsvp)
    db.session.commit()

def seed_comments(users, events, num_comments=30):
    for _ in range(num_comments):
        comment = Comment(
            content=fake.sentence(),
            user_id=random.choice(users).id,
            event_id=random.choice(events).id,
        )
        db.session.add(comment)
    db.session.commit()

def seed_group_invitations(users, groups, num_invitations=20):
    for _ in range(num_invitations):
        inviter = random.choice(users)
        invitee = random.choice(users)

        # Avoid self-invitations
        while invitee.id == inviter.id:
            invitee = random.choice(users)

        group_invitation = GroupInvitation(
            group_id=random.choice(groups).id,
            inviter_id=inviter.id,
            invited_user_id=invitee.id,
            status=random.choice(['pending', 'accepted', 'declined']),
        )
        db.session.add(group_invitation)
    db.session.commit()

def seed_event_invitations(users, events, num_invitations=20):
    for _ in range(num_invitations):
        inviter = random.choice(users)
        invitee = random.choice(users)

        # Avoid self-invitations
        while invitee.id == inviter.id:
            invitee = random.choice(users)

        # Use datetime.now(timezone.utc) for timestamps
        event_invitation = EventInvitation(
            event_id=random.choice(events).id,
            inviter_id=inviter.id,
            invitee_id=invitee.id,
            status=random.choice(['Pending', 'Accepted', 'Denied']),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.session.add(event_invitation)
    db.session.commit()

# Run the seed functions
def seed_all():
    with app.app_context():  # Ensure the application context is active
        db.drop_all()
        db.create_all()

        users = seed_users()
        groups = seed_groups(users)
        events = seed_events(users)
        
        seed_group_members(users, groups)  # Add group members
        seed_rsvps(users, events)
        seed_comments(users, events)
        seed_group_invitations(users, groups)
        seed_event_invitations(users, events)

        print("Database seeded successfully!")

if __name__ == "__main__":
    seed_all()
