from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_restful import Api
from flask_cors import CORS
from dotenv import load_dotenv
from datetime import timedelta
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

#app = Flask(__name__)

app = Flask(
    __name__,
    static_url_path='',
    static_folder='../client/dist',
    template_folder='../client/dist'
)

# Secure Application Secrets
app.secret_key = os.getenv("FLASK_SECRET_KEY")  # Make sure this is set in your environment
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URI")  # Production database URL
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False  # Keep this False to save resources

# JWT Configuration
app.config['JWT_TOKEN_LOCATION'] = ['cookies']
app.config['JWT_COOKIE_SECURE'] = True  # Enforces secure cookies over HTTPS changed to false for development
app.config['JWT_COOKIE_SAMESITE'] = 'None'  # Required for cross-site cookie sharing changed to Lax for development, None for production
app.config['JWT_COOKIE_HTTPONLY'] = True  # Prevents JavaScript from accessing cookies changed to false for development
app.config['JWT_ACCESS_COOKIE_PATH'] = '/'  # Path for access tokens
app.config['JWT_REFRESH_COOKIE_PATH'] = '/token/refresh'  # Path for refresh tokens
app.config['JWT_COOKIE_CSRF_PROTECT'] = True  # always true Enable CSRF protection in production and development
app.config['JWT_CSRF_IN_COOKIES'] = True  # Ensures CSRF token is stored and validated in cookies
app.config['JWT_CSRF_CHECK_FORM'] = True  # Ensure forms are checked for CSRF tokens in production
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')  # Secure JWT key from environment

app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)  # Access tokens expire in 1 hour
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=7)  # Refresh tokens expire in 7 days

# Optional: CSRF Protection for Flask-WTF
# Uncomment if using Flask-WTF for forms
#app.config['WTF_CSRF_ENABLED'] = True

db = SQLAlchemy(metadata=metadata)

migrate = Migrate(app, db)

db.init_app(app)

bcrypt = Bcrypt(app=app)

api = Api(app)


#Development
#CORS(app, supports_credentials=True, origins=["http://localhost:5173"])
#Make sure the CORS origins match your frontend URL

#Production
CORS(app, supports_credentials=True, origins=["https://event-manager-dtae.onrender.com"])