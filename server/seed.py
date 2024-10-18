from faker import Faker
from config import app, db
from models import User, Event, Group, RSVP, Comment, GroupInvitation
import random


if __name__ == "__main__":
  with app.app_context():
    pass
    # remove pass and write your seed data
