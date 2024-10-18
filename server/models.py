from sqlalchemy_serializer import SerializerMixin
from config import db
from sqlalchemy.orm import validates
import re
import bcrypt