from sqlalchemy_serializer import SerializerMixin
from config import db
from sqlalchemy.orm import validates
import re
import bcrypt



group_member = db.Table('group_member',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('group_id', db.Integer, db.ForeignKey('groups.id'), primary_key=True)
)


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
    sent_invitations = db.relationship('GroupInvitation', foreign_keys='GroupInvitation.user_id', back_populates='inviter', cascade="all, delete-orphan")
    received_invitations = db.relationship('GroupInvitation', foreign_keys='GroupInvitation.invited_user_id', back_populates='invitee', cascade="all, delete-orphan")

    serialize_rules = ('-password_hash', '-events', '-sent_invitations', '-received_invitations', '-comments', '-rsvps', '-groups')


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
        if group not in self.groups:
            self.groups.append(group)
            db.session.commit()
    

class Group(db.Model, SerializerMixin):
    __tablename__ = 'groups'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    description = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    members = db.relationship('User', secondary=group_member, back_populates='groups')
    invitations = db.relationship('GroupInvitation', back_populates='group', cascade="all, delete-orphan")

    serialize_rules = ('-invitations', 'members.username')


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

    serialize_rules = ('-comments', '-rsvps', '-user')


class GroupInvitation(db.Model, SerializerMixin):
    __tablename__ = 'group_invitations'
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('groups.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    invited_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False)

    inviter = db.relationship('User', foreign_keys=[user_id], back_populates='sent_invitations')
    invitee = db.relationship('User', foreign_keys=[invited_user_id], back_populates='received_invitations')
    group = db.relationship('Group', back_populates='invitations')

    serialize_rules = ('-inviter', '-invitee', '-group')


class RSVP(db.Model, SerializerMixin):
    __tablename__ = 'rsvps'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False)

    user = db.relationship('User', back_populates='rsvps')
    event = db.relationship('Event', back_populates='rsvps')

    serialize_rules = ('-user', '-event')


class Comment(db.Model, SerializerMixin):
    __tablename__ = 'comments'
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=False)

    user = db.relationship('User', back_populates='comments')
    event = db.relationship('Event', back_populates='comments')

    serialize_rules = ('-user', '-event')