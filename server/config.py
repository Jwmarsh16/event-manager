from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_restful import Api
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

naming_convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

metadata = MetaData(naming_convention=naming_convention)

app = Flask(
    __name__,
    static_url_path='',
    static_folder='../client/dist',
    template_folder='../client/dist'
)
app.secret_key = os.getenv("FLASK_SECRET_KEY")
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URI")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

app.config['JWT_TOKEN_LOCATION'] = ['cookies']
app.config['JWT_COOKIE_SECURE'] = True  # Set to True in production when using HTTPS
app.config['JWT_COOKIE_SAMESITE'] = 'None'
app.config['JWT_COOKIE_HTTPONLY'] = True
app.config['JWT_ACCESS_COOKIE_PATH'] = '/'
app.config['JWT_REFRESH_COOKIE_PATH'] = '/token/refresh'
app.config['JWT_COOKIE_CSRF_PROTECT'] = False
app.config['JWT_CSRF_CHECK_FORM'] = True
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your_secure_secret_key')  # Updated to a more secure key


db = SQLAlchemy(metadata=metadata)

migrate = Migrate(app, db)

db.init_app(app)

bcrypt = Bcrypt(app=app)

api = Api(app)
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])
  # Make sure the CORS origins match your frontend URL
