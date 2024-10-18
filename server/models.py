from sqlalchemy_serializer import SerializerMixin
from config import db
from sqlalchemy.orm import validates
import re
import bcrypt


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