from sqlalchemy_serializer import SerializerMixin
from config import db
from sqlalchemy.orm import validates
import re
import bcrypt
from datetime import datetime, timezone


# Association tables remain the same
group_member = db.Table(
    'group_member',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('group_id', db.Integer, db.ForeignKey('groups.id'), primary_key=True)
)

event_invitation = db.Table(
    'event_invitation',
    db.Column('event_id', db.Integer, db.ForeignKey('events.id'), primary_key=True),
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True)
)

class GroupInvitation(db.Model, SerializerMixin):
    __tablename__ = 'group_invitations'
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('groups.id'), nullable=False)
    inviter_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    invited_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='pending')

    group = db.relationship('Group', back_populates='invitations')
    inviter = db.relationship('User', foreign_keys=[inviter_id], back_populates='sent_group_invitations')
    invitee = db.relationship('User', foreign_keys=[invited_user_id], back_populates='received_group_invitations')

    serialize_rules = (
        '-group',
        '-inviter',
        '-invitee'
    )

    def accept(self):
        """Mark the invitation as accepted and add the user to the group."""
        self.status = "Accepted"
        self.invitee.add_group(self.group)
        db.session.commit()

    def deny(self):
        """Mark the invitation as denied."""
        self.status = "Denied"
        db.session.commit()

class User(db.Model, SerializerMixin):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

    events = db.relationship('Event', back_populates='user', cascade="all, delete-orphan")
    comments = db.relationship('Comment', back_populates='user', cascade="all, delete-orphan")
    rsvps = db.relationship('RSVP', back_populates='user', cascade="all, delete-orphan")
    groups = db.relationship('Group', secondary=group_member, back_populates='members')
    
    sent_event_invitations = db.relationship(
        'EventInvitation',
        foreign_keys='EventInvitation.inviter_id',
        back_populates='inviter',
        cascade="all, delete-orphan"
    )
    sent_group_invitations = db.relationship(
        'GroupInvitation',
        foreign_keys='GroupInvitation.inviter_id',
        back_populates='inviter',
        cascade="all, delete-orphan"
    )
    received_event_invitations = db.relationship(
        'EventInvitation',
        foreign_keys='EventInvitation.invitee_id',
        back_populates='invitee',
        cascade="all, delete-orphan"
    )
    received_group_invitations = db.relationship(
        'GroupInvitation',
        foreign_keys='GroupInvitation.invited_user_id',
        back_populates='invitee',
        cascade="all, delete-orphan"
    )
    invited_events = db.relationship(
        'Event',
        secondary=event_invitation,
        back_populates="invited_users"
    )

    serialize_rules = (
        '-password_hash',
        '-events',
        '-comments',
        '-rsvps',
        '-groups',
        '-sent_group_invitations',  # Block entire relation
        '-received_group_invitations',  # Block entire relation
        '-sent_event_invitations',  # Block entire relation
        '-received_event_invitations',  # Block entire relation
        '-invited_events',
        '-invited_events'
    )



    # Validation methods remain the same
    @validates('username')
    def validate_username(self, key, username):
        if not username:
            raise ValueError("Username is required.")
        if len(username) < 3 or len(username) > 80:
            raise ValueError("Username must be between 3 and 80 characters.")
        if not re.match("^[a-zA-Z0-9_.-]+$", username):
            raise ValueError("Username must contain only letters, numbers, and underscores.")
        return username

    @validates('email')
    def validate_email(self, key, email):
        if not email:
            raise ValueError("Email is required.")
        email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
        if not re.match(email_regex, email):
            raise ValueError("Invalid email address.")
        return email

    @validates('password_hash')
    def validate_password(self, key, password_hash):
        password = self._original_password
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not re.search(r"[A-Z]", password):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[a-z]", password):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(r"[0-9]", password):
            raise ValueError("Password must contain at least one digit.")
        return password_hash

    @property
    def password(self):
        raise AttributeError('password is not a readable attribute')

    @password.setter
    def password(self, password):
        self._original_password = password
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def add_group(self, group):
        """Add the user to a group."""
        if not self.is_member_of_group(group):
            self.groups.append(group)
            db.session.commit()

    def is_member_of_group(self, group):
        """Check if the user is already a member of the group."""
        return group in self.groups

class Group(db.Model, SerializerMixin):
    __tablename__ = 'groups'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    description = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    members = db.relationship('User', secondary=group_member, back_populates='groups')
    invitations = db.relationship('GroupInvitation', back_populates='group', cascade="all, delete-orphan")

    serialize_rules = ('-members.groups', '-invitations.group')

class Event(db.Model, SerializerMixin):
    __tablename__ = 'events'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    date = db.Column(db.DateTime, nullable=False)
    location = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    user = db.relationship('User', back_populates='events')
    comments = db.relationship('Comment', back_populates='event', cascade="all, delete-orphan")
    rsvps = db.relationship('RSVP', back_populates='event', cascade="all, delete-orphan")
    invited_users = db.relationship(
        'User',
        secondary=event_invitation,
        back_populates="invited_events"
    )
    invitations = db.relationship('EventInvitation', back_populates='event', cascade="all, delete-orphan")

    serialize_rules = (
        '-user.events',
        '-comments.event',
        '-rsvps.event',
        '-invitations',  # Block entire invitations relationship
        '-invited_users.events',
        '-invited_users.invited_events'
    )

class EventInvitation(db.Model, SerializerMixin):
    __tablename__ = 'event_invitations'
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=False)
    inviter_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    invitee_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="Pending")
    created_at = db.Column(
        db.DateTime, 
        nullable=False, 
        default=lambda: datetime.now(timezone.utc)  # Use timezone-aware UTC timestamp
    )
    updated_at = db.Column(
        db.DateTime, 
        nullable=False, 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc)  # Automatically update on modification
    )

    event = db.relationship('Event', back_populates='invitations')
    inviter = db.relationship('User', foreign_keys=[inviter_id], back_populates='sent_event_invitations')
    invitee = db.relationship('User', foreign_keys=[invitee_id], back_populates='received_event_invitations')

    serialize_rules = (
        '-event',  # Block entire event relationship
        '-inviter',  # Block entire inviter relationship
        '-invitee'   # Block entire invitee relationship
    )


class RSVP(db.Model, SerializerMixin):
    __tablename__ = 'rsvps'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False)

    user = db.relationship('User', back_populates='rsvps')
    event = db.relationship('Event', back_populates='rsvps')

    serialize_rules = ('-user.rsvps', '-event.rsvps')

class Comment(db.Model, SerializerMixin):
    __tablename__ = 'comments'
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=False)

    user = db.relationship('User', back_populates='comments')
    event = db.relationship('Event', back_populates='comments')

    serialize_rules = ('-user.comments', '-event.comments')